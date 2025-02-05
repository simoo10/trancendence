import random
import os
import numpy as np
from collections      import deque
# from keras.models     import Sequential
# from keras.layers     import Dense
# from keras.optimizers import Adam
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
import time
import logging
import tensorflow as tf
from tensorflow.keras.mixed_precision import set_global_policy
set_global_policy('mixed_float16')

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TF logging except errors
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Disable GPU
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN optimizations
# os.environ['TF_ENABLE_ONEDNN_OPTS'] = '1'

print("\n\n\n\nTensorFlow version:", tf.__version__)
print("\n\n\n\n\noneDNN enabled:", "ONEDNN" in tf.sysconfig.get_compile_flags())
print("Num GPUs Available: ", len(tf.config.experimental.list_physical_devices('GPU')))
print("Num CPUs Available: ", len(tf.config.experimental.list_physical_devices('CPU')))

# Configure the logging
logging.basicConfig(
    filename='replay_debug_dqn.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class DQNAgent():
    def __init__(self, state_size, action_size, Train):
        self.weight_backup      = "pong_weight-14.keras"
        self.state_size         = state_size
        self.action_size        = action_size
        self.memory             = deque(maxlen=2000)
        self.learning_rate      = 0.0001
        self.gamma              = 0.95
        self.exploration_rate   = 1.0
        self.exploration_min    = 0.01
        self.exploration_decay  = 0.9995
        self.brain              = self._build_model()
        self.sample_batch_size  = 64
        self.Train              = Train
        self.episode            = 1

    def _build_model(self):
        # Neural Net for Deep-Q learning Model
        model = Sequential()
        model.add(Dense(24, input_dim=self.state_size, activation='relu'))
        model.add(Dense(24, activation='relu'))
        model.add(Dense(self.action_size, activation='linear'))
        model.compile(loss='mse', optimizer=Adam(learning_rate=self.learning_rate))

        # model = Sequential()
        # model.add(Dense(64, input_dim=self.state_size, activation='relu'))  # Increased neurons
        # model.add(Dense(128, activation='relu'))  # Added more layers with more neurons
        # model.add(Dense(64, activation='relu'))  # Additional layer
        # model.add(Dense(self.action_size, activation='linear'))  # Output layer remains the same
        # model.compile(loss='mse', optimizer=Adam(learning_rate=self.learning_rate))

        if os.path.isfile(self.weight_backup):
            model.load_weights(self.weight_backup)
            # self.exploration_rate = self.exploration_min
        return model

    def save_model(self):
            try:
                self.brain.save(self.weight_backup)
                print ("\n\n\n\n\n\n-----------------------saved model saccefully")
            except Exception as e:
                print (f"\n\n\n\n\n\n\n\n\n-------------------------------Error saving model: {str(e)}")
            # timestamp = int(time.time())
            # model_filename = f"pong_model_{timestamp}.keras"
            # try:
            #     self.brain.save(model_filename)
            #     print(f"Model saved as {model_filename}")
            # except Exception as e:
            #     print(f"Error saving model: {str(e)}")

    def act(self, state):
        if self.Train and np.random.rand() <= self.exploration_rate:
            return random.randrange(self.action_size)
        
        act_values = self.brain.predict(state)

        print(f"act_values: {act_values} , action: {np.argmax(act_values[0])}, for exploration_rate: {self.exploration_rate}")
        return np.argmax(act_values[0])

    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    # def replay(self):
    #     while True:
    #         if len(self.memory) < self.sample_batch_size:
    #             continue
    #         sample_batch = random.sample(self.memory, self.sample_batch_size)
    #         # logging.debug(f"sample_batch: {sample_batch}")
    #         for state, action, reward, next_state, done in sample_batch:
    #             target = reward
    #             if not done:
    #                 target = reward + self.gamma * np.amax(self.brain.predict(next_state)[0])
    #             target_f = self.brain.predict(state)
    #             # logging.debug(f"target_f: {target_f}, target: {target}, action: {action}")
    #             target_f[0][action] = target
    #             self.brain.fit(state, target_f, epochs=1, verbose=0)
    #         if self.exploration_rate > self.exploration_min:
    #             self.exploration_rate *= self.exploration_decay
    #         self.episode += 1
    #         print ("episode = ", self.episode)
    #         if self.episode % 100 == 0:
    #             self.save_model()
    #             self.episode = 1

    def replay(self):
        # while True:
        # print ("replay len of memory = ", len(self.memory))
        # if len(self.memory) < self.sample_batch_size:
        #     return

        # sample_batch = random.sample(self.memory, self.sample_batch_size)
        # states = np.array([sample[0] for sample in sample_batch])
        # states = np.reshape(states, (self.sample_batch_size, self.state_size))
        # # states = np.squeeze(states)
        # next_states = np.array([sample[3] for sample in sample_batch])
        # next_states = np.reshape(next_states, (self.sample_batch_size, self.state_size))
        # # next_states = np.squeeze(next_states)



        # # Batch predictions
        # targets = self.brain.predict(states)
        # next_q_values = self.brain.predict(next_states)

        # for i, (state, action, reward, next_state, done) in enumerate(sample_batch):
        #     target = reward
        #     if not done:
        #         target = reward + self.gamma * np.amax(next_q_values[i])
        #     targets[i][action] = target

        # # Train on the batch
        # self.brain.fit(states, targets, epochs=1, verbose=0)

        # # Decay exploration rate
        # if self.exploration_rate > self.exploration_min:
        #     self.exploration_rate *= self.exploration_decay
        
        # if len(self.memory) >= 2000:
        #     self.memory.clear()
        #     self.memory = deque(maxlen=2000)

        # self.episode += 1
        # print("episode =", self.episode)
        # if self.episode % 100 == 0:
        #     self.save_model()


        if len(self.memory) < self.sample_batch_size:
            return
        sample_batch = random.sample(self.memory, self.sample_batch_size)
        # logging.debug(f"sample_batch: {sample_batch}")
        for state, action, reward, next_state, done in sample_batch:
            target = reward
            if not done:
                target = reward + self.gamma * np.amax(self.brain.predict(next_state)[0])
            target_f = self.brain.predict(state)
            # logging.debug(f"target_f: {target_f}, target: {target}, action: {action}")
            target_f[0][action] = target
            self.brain.fit(state, target_f, epochs=1, verbose=0)
        if self.exploration_rate > self.exploration_min:
            self.exploration_rate *= self.exploration_decay
        
        # if len(self.memory) >= 2000:
        self.memory.clear()
            # self.memory = deque(maxlen=2000)
        self.episode += 1
        print ("episode = ", self.episode, self.exploration_rate)
        if self.episode % 100 == 0:
            self.save_model()
                