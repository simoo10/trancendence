import tensorflow as tf
from tensorflow.keras.callbacks import ModelCheckpoint
import numpy as np
import random
import os
import logging
from collections import deque

os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Configure the logging
logging.basicConfig(
    filename='replay_debug_dqn.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class DQNAgent:
    def __init__(self, state_size, action_size, Train):
        self.state_size = state_size
        self.action_size = action_size
        self.memory = deque(maxlen=2000)
        self.gamma = 0.99  # Discount rate
        self.epsilon = 100.0  # Exploration rate
        self.epsilon_min = 0.01
        self.epsilon_decay = 0.995
        self.episode = 0
        self.learning_rate = 0.00001
        self.batch_size = 64
        self.best_model_path = "best_model.weights.h5"
        self.current_model_path = "ping_pong_dqn_model.weights.h5"
        self.model = self._build_model()
        self.training_mode = True  # Toggle training on/off
        self.Train = Train

    def _build_model(self):
        # Define the model architecture
        model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(self.state_size,)),  # Use Input layer here
            tf.keras.layers.Dense(256),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Activation('relu'),
            tf.keras.layers.Dense(256),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Activation('relu'),
            tf.keras.layers.Dense(128),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Activation('relu'),
            tf.keras.layers.Dense(self.action_size, activation='linear')
        ])
        
        model.compile(
            loss=tf.keras.losses.Huber(),
            optimizer=tf.keras.optimizers.Adam(learning_rate=self.learning_rate)
        )
        logging.debug("Model built from scratch.")

        # Load weights if a saved model exists
        if os.path.exists(self.current_model_path):
            try:
                model.load_weights(self.current_model_path)
                print(f"Loaded weights from '{self.current_model_path}'.")
                logging.debug("Loaded current model weights successfully.")
            except Exception as e:
                print(f"Error loading weights: {e}")
                logging.error(f"Error loading weights: {e}")

        return model

    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    def act(self, state):
        if self.Train and np.random.rand() <= self.epsilon:
            return np.random.randint(self.action_size)
        
        state_tensor = tf.convert_to_tensor(state, dtype=tf.float32)
        act_values = self.model.predict(state_tensor, verbose=0)
        logging.debug(f"epsilon : {self.epsilon} and action {np.argmax(act_values[0])} > Predicted Q-values: {act_values}, from state: {state_tensor}")
        return np.argmax(act_values[0])

    @tf.function
    def predict(self, state):
        return self.model(state, training=False)

    def replay(self):
        while True:
            if len(self.memory) < self.batch_size:
                continue

            minibatch = random.sample(self.memory, self.batch_size)
            states, targets_f = [], []

            for state, action, reward, next_state, done in minibatch:
                state = np.array(state, dtype=np.float32).reshape(-1, self.state_size)
                next_state = np.array(next_state, dtype=np.float32).reshape(-1, self.state_size)
                next_state_tensor = tf.convert_to_tensor(next_state, dtype=tf.float32)

                future_reward = np.amax(self.predict(next_state_tensor).numpy()[0])
                target = reward if done else reward + self.gamma * future_reward

                target_f = self.predict(tf.convert_to_tensor(state, dtype=tf.float32)).numpy()
                target_f[0][action] = target

                states.append(state)
                targets_f.append(target_f)

            states = np.vstack(states)
            targets_f = np.vstack(targets_f)
            self.model.fit(states, targets_f, epochs=100, verbose=0)

            if self.epsilon > self.epsilon_min:
                self.epsilon *= self.epsilon_decay

            if self.episode % 100 == 0:
                try:
                    self.model.save_weights(self.current_model_path)
                    logging.debug("Model weights saved successfully.")
                except Exception as e:
                    logging.error(f"Error saving model weights: {e}")

            self.episode += 1
            # if len(self.memory) > 2000:
            #     self.memory.pop(0)


    def evaluate_agent(self):
        if not self.training_mode and os.path.exists(self.best_model_path):
            try:
                self.model.load_weights(self.best_model_path)
                logging.debug(f"Loaded best model weights from '{self.best_model_path}'.")
            except Exception as e:
                logging.error(f"Error loading best model weights: {e}")
                return

        total_reward = 0
        num_episodes = 10
        for _ in range(num_episodes):
            state = self.reset_environment()
            done = False
            while not done:
                action = self.act(state)
                next_state, reward, done = self.step(action)
                state = next_state
                total_reward += reward

        avg_reward = total_reward / num_episodes
        logging.debug(f"Average reward in evaluation: {avg_reward}")
        return avg_reward

    def reset_environment(self):
        """Resets the environment to the initial state."""
        # Example: Reset the ball and paddles to initial positions
        self.ball_position = [0, 0]  # Reset ball position (x, y)
        self.paddle1_position = [0, -1]  # Reset paddle1 position (x, y)
        self.paddle2_position = [0, 1]  # Reset paddle2 position (x, y)
        
        # Return the initial state as an array (e.g., [ball_x, ball_y, paddle1_y])
        return np.array([self.ball_position[0], self.ball_position[1], self.paddle1_position[1]])


    def step(self, action):
        """Executes the given action in the environment."""
        # Action affects the paddle's position (0: stay, 1: move up, 2: move down)
        if action == 1:
            self.paddle1_position[1] += 0.1  # Move paddle up
        elif action == 2:
            self.paddle1_position[1] -= 0.1  # Move paddle down

        # Update ball position (e.g., based on game physics or current direction)
        self.ball_position[0] += self.ball_velocity[0]
        self.ball_position[1] += self.ball_velocity[1]

        # Calculate reward (e.g., hit ball, miss ball, etc.)
        reward = 0
        done = False

        # Check for paddle and ball collision
        if abs(self.ball_position[1] - self.paddle1_position[1]) < 0.2 and self.ball_position[0] == 0:
            reward = 1  # Reward for hitting the ball
            self.ball_velocity[0] = -self.ball_velocity[0]  # Reverse ball direction
        elif self.ball_position[0] < -1 or self.ball_position[0] > 1:
            reward = -1  # Penalty for missing the ball
            done = True  # End game if the ball is out of bounds

        # Return next state, reward, and done flag
        next_state = np.array([self.ball_position[0], self.ball_position[1], self.paddle1_position[1]])
        return next_state, reward, done


    def load(self, name):
        try:
            self.model.load_weights(name)
            logging.debug(f"Loaded weights from {name}.")
        except Exception as e:
            logging.error(f"Could not load weights from {name}: {str(e)}")

    def save(self, name):
        try:
            self.model.save_weights(name)
            logging.debug(f"Saved weights to {name}.")
        except Exception as e:
            logging.error(f"Error saving weights to {name}: {str(e)}")
