import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
# from .dqn_agent import DQNAgent
from .train_model import DQNAgent
from .consumer import Demonsions
import numpy as np
import tensorflow as tf
import threading
import math
import time

import logging

# Configure the logging
logging.basicConfig(
    filename='replay_debug.log',  # Name of the log file
    level=logging.DEBUG,  # Log all messages (DEBUG and above)
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class Game:
    def __init__(self, width, height):
        self.speed = 1
        self.Train = False
        self.first = True
        self.width = width
        self.height = height
        self.plan_width = self.width / 20.0
        self.plan_height = self.plan_width / 2
        # Initialize game parameters like paddle size, ball speed, etc.
        self.paddle_width = self.plan_width / 100
        self.paddle_height = self.plan_height / 7
        self.paddle_depth = 1.2
        self.paddle_speed = self.speed
        # self.agent = DQNAgent(state_size, action_size)

        # Player 1 Paddle initial position (left side)
        self.paddle1_x = -(self.plan_width * 0.90) / 2
        self.paddle1_y = 0

        # Player 2 Paddle initial position (right side)
        self.paddle2_x = (self.plan_width * 0.90) / 2
        self.paddle2_y = 0

        self.previous_paddle2_x = self.paddle2_x
        self.previous_paddle2_y = self.paddle2_y


        # Ball properties
        self.ball_radius = self.plan_width / 80
        self.ball_x = 0
        self.ball_y = 0
        self.ball_dir_x = 1  # Ball direction on the X axis (positive: right, negative: left)
        self.ball_dir_y = 1  # Ball direction on the Y axis (positive: up, negative: down)
        self.ball_speed = self.speed   # Ball movement speed

        self.previous_ball_x = 0
        self.previous_ball_y = 0
        self.previous_ball_dir_x = 0
        self.previous_ball_dir_y = 0
        self.previous_ball_speed = 0.4
        self.accumulated_reward = 0

        # Score properties
        self.score1 = 0
        self.score2 = 0
        self.reward = 0
        self.collision2 = False

        self.episode = 0

        self.last_ai_move_time = time.time()  # Initialize the timer
        self.ai_move_interval = 1  # AI moves every 1 second

        self.previous_predict_ball_landing_y = 0

        # Key states (to track user input from frontend)
        self.keys = {
            "UpKey1": False,
            "DownKey1": False,
            "RightKey1": False,
            "LeftKey1": False,
            "UpKey2": False,
            "DownKey2": False,
            "RightKey2": False,
            "LeftKey2": False
        }

        self.previous_second_ball_dir_x = self.ball_dir_x
        self.previous_second_ball_dir_y = self.ball_dir_y
        self.previous_second_ball_speed = self.ball_speed
        self.previous_second_paddle2_x = self.paddle2_x
        self.previous_second_paddle2_y = self.paddle2_y
        self.previous_second_predict_ball_landing_y = 0.0
        self.previous_second_ball_x = self.ball_x
        self.previous_second_ball_y = self.ball_y
        self.previous_second_paddle_speed = self.paddle_speed
        self.movement = 0
        self.previous_movement = 0
        self.movement = 0


        self.state_size = 11  # paddle2_x, paddle2_y, paddle_speed, ball_x, ball_y, ball_dir_x, ball_dir_y, ball_speed, previous_predict_ball_landing_y,  movement
        self.action_size = 3  # up, stay, down
        self.agent = DQNAgent(self.state_size, self.action_size, self.Train)

        # state and next_state to handle time
        self.state = np.array([[self.paddle2_x, self.paddle2_y, self.paddle_speed, self.ball_x, self.ball_y, self.ball_speed, self.ball_dir_x, self.ball_dir_y,0, 0, 0]])
        self.next_state = np.array([[self.paddle2_x, self.paddle2_y, self.paddle_speed, self.ball_x, self.ball_y, self.ball_speed, self.ball_dir_x, self.ball_dir_y, 0, 0, 0]])
    
    # Method to adjust the game state in case of resizing window
    def adjust_game_state(self, new_width, new_height):
        # Calculate scale factors
        scale_width = new_width / self.width
        scale_height = new_height / self.height

        # Update dimensions
        self.width = new_width
        self.height = new_height
        self.plan_width = self.width  / 20.0
        self.plan_height = self.plan_width / 2

        
        # Scale paddles
        self.paddle_width = self.plan_width / 100
        self.paddle_height = self.plan_height / 7
        self.paddle1_x *= scale_width
        self.paddle1_y *= scale_height
        self.paddle2_x *= scale_width
        self.paddle2_y *= scale_height

        # Scale ball
        self.ball_x *= scale_width
        self.ball_y *= scale_height
        self.ball_speed *= max(scale_width, scale_height)  # Adjust speed based on dominant scale

        # Update previous ball positions
        self.previous_ball_x *= scale_width
        self.previous_ball_y *= scale_height
        self.previous_ball_speed *= max(scale_width, scale_height)

        # Update scores, rewards, and other gameplay metrics (unchanged unless needed)
        self.previous_paddle2_x *= scale_width
        self.previous_paddle2_y *= scale_height
        self.previous_ball_dir_x = self.ball_dir_x
        self.previous_ball_dir_y = self.ball_dir_y
        self.ball_radius = self.plan_width / 80

    

    def predict_ball_landing_y_opponent(self):
        """
        Predicts the y-position where the ball will reach paddle1_x, handling out-of-bounds scenarios.
        
        Returns:
        - The predicted y-position of the ball when it reaches paddle1_x,
        or None if the ball is out of bounds.
        """
        current_x = self.ball_x
        current_y = self.ball_y
        current_dir_x = self.ball_dir_x
        current_dir_y = self.ball_dir_y

        # If the ball is out of bounds, return None
        if current_x > self.plan_width / 2 or current_x < -(self.plan_width / 2):
            print("Ball out of bounds.")
            return None

        # Define a maximum number of iterations to prevent infinite loops
        max_iterations = 1000
        iteration_count = 0

        while True:
            iteration_count += 1
            if iteration_count > max_iterations:
                # Break the loop if something goes wrong to avoid infinite loops
                print("1-Exceeded maximum iterations; returning None to prevent infinite loop.")
                return None

            # Calculate the time to reach paddle1_x
            if current_dir_x <= 0:
                time_to_paddle = (self.paddle1_x - current_x) / (current_dir_x * self.ball_speed)
            else:
                return None  # Ball is not moving horizontally

            # If no bounce occurs before reaching paddle1_x, calculate final y
            next_y = current_y + current_dir_y * self.ball_speed * time_to_paddle
            if next_y + self.ball_radius <= self.plan_height / 2 and next_y - self.ball_radius >= -self.plan_height / 2:
                return next_y

            # Handle bounces off the top or bottom walls
            if current_dir_y < 0:
                time_to_wall = ((self.plan_height / 2 - self.ball_radius) - current_y) / (current_dir_y * self.ball_speed)
            else:
                time_to_wall = ((-self.plan_height / 2 + self.ball_radius) - current_y) / (current_dir_y * self.ball_speed)

            # Update ball position and direction after bouncing off the wall
            current_x -= current_dir_x * self.ball_speed * time_to_wall
            current_y -= current_dir_y * self.ball_speed * time_to_wall
            current_dir_y = -current_dir_y  # Reverse y-direction on bounce


    def predict_ball_landing_y(self):
        """
        Predicts the y-position where the ball will reach paddle2_x, handling out-of-bounds scenarios.
        
        Returns:
        - The predicted y-position of the ball when it reaches paddle2_x,
        or None if the ball is out of bounds.
        """
        current_x = self.ball_x
        current_y = self.ball_y
        current_dir_x = self.ball_dir_x
        current_dir_y = self.ball_dir_y

        # If the ball is out of bounds, return None
        if current_x > self.plan_width / 2 or current_x < -(self.plan_width / 2):
            print("Ball out of bounds.")
            return None
        # Define a maximum number of iterations to prevent infinite loops
        max_iterations = 1000
        iteration_count = 0

        while True:
            iteration_count += 1
            if iteration_count > max_iterations:
                # Break the loop if something goes wrong to avoid infinite loops
                print("2-Exceeded maximum iterations; returning None to prevent infinite loop.")
                return None


            # Calculate the time to reach paddle2_x
            if current_dir_x >= 0:
                time_to_paddle = (self.paddle2_x - current_x) / (current_dir_x * self.ball_speed)
            else:
                return None  # Ball is not moving horizontally

            # If no bounce occurs before reaching paddle2_x, calculate final y
            next_y = current_y + current_dir_y * self.ball_speed * time_to_paddle
            if next_y + self.ball_radius <= self.plan_height / 2 and next_y - self.ball_radius >= -self.plan_height / 2:
                return next_y

            # Handle bounces off the top or bottom walls
            if current_dir_y > 0:
                time_to_wall = ((self.plan_height / 2 - self.ball_radius) - current_y) / (current_dir_y * self.ball_speed)
            else:
                time_to_wall = ((-self.plan_height / 2 + self.ball_radius) - current_y) / (current_dir_y * self.ball_speed)

            # Update ball position and direction after bouncing off the wall
            current_x += current_dir_x * self.ball_speed * time_to_wall
            current_y += current_dir_y * self.ball_speed * time_to_wall
            current_dir_y = -current_dir_y  # Reverse y-direction on bounce



    def is_idle_or_stuck(self):
        return abs(self.paddle2_y - self.previous_paddle2_y) < 0.5


    # Improved reward calculation method for the game class
    def calculate_reward(self, predict_ball_landing_y):
        reward = 0

        # Base position reward
        if abs(self.ball_x - self.paddle2_x) > self.plan_width / 4:
            distance_to_center = abs(self.paddle2_y)
            reward -= distance_to_center * 0.01  # Small penalty for being away from center

        # Ball interception reward
        if self.collision2:
            # logging.debug("Rewarded for hitting the ball")
            hit_offset = abs(self.ball_y - self.paddle2_y)
            clamped_offset = min(hit_offset, self.paddle_height / 2)
            normalized_offset = clamped_offset / (self.paddle_height / 2)
            reward += 2.0  # Ensure a minimum reward
            self.collision2 = False


        # Positioning reward
        else:
            # predict_ball_landing_y = self.predict_ball_landing_y()
            if predict_ball_landing_y is not None and (abs(predict_ball_landing_y - ((self.paddle_width / 2) * 0.90) - self.paddle2_y) > abs(predict_ball_landing_y - ((self.paddle_width / 2) * 0.90) - self.previous_paddle2_y))\
                and abs(predict_ball_landing_y + ((self.paddle_width / 2) * 0.90) - self.paddle2_y) > abs(predict_ball_landing_y + ((self.paddle_width / 2) * 0.90) - self.previous_paddle2_y):
                reward -= 1.0
                if self.is_idle_or_stuck():
                    reward -= 0.1
            else:
                if predict_ball_landing_y is not None and abs(predict_ball_landing_y - self.paddle2_y) == abs(predict_ball_landing_y - self.previous_paddle2_y) and (self.paddle2_y > predict_ball_landing_y + ((self.paddle_width / 2) * 0.90) or self.paddle2_y < predict_ball_landing_y - ((self.paddle_width / 2) * 0.90)):
                    reward -= 0.1
                else:
                    reward += 1.0 
            # logging.debug(f"ball y: {self.ball_y}, ball x: {self.ball_x}")


            # Penalty for letting the ball pass
            if abs(self.ball_x) > abs(self.paddle2_x) and (self.ball_x * self.paddle2_x) >= 0:
                reward -= 1.0

            # Reward for opponent missing
            if abs(self.ball_x) > abs(self.paddle1_x) and (self.ball_x * self.paddle1_x) >= 0:
                reward += 1.0 

            # Penalize idleness or being stuck

        # Game-ending rewards
        if self.score1 == 10:
            reward += 1.0
        elif self.score2 == 10:
            reward -= 1.0

        # logging.debug(f"Calculated reward: {reward}")
        return reward



    # Method to update paddle positions based on key states
    def update_paddles(self):

        curr_time = time.time()
        predict_ball_landing_y = 0.0
        previous_paddle1_y = self.paddle1_y
        previous_paddle1_x = self.paddle1_x
        # Update Paddle 1 (player 1) position based on key presses
        if self.keys["UpKey1"] and self.paddle1_y < self.plan_height / 2:
            self.paddle1_y += self.paddle_speed
        if self.keys["DownKey1"] and self.paddle1_y > -self.plan_height / 2:
            self.paddle1_y -= self.paddle_speed
        if self.keys["LeftKey1"] and self.paddle1_x > -(self.plan_width * 0.95) / 2:
            self.paddle1_x -= self.paddle_speed
        if self.keys["RightKey1"] and self.paddle1_x < -self.plan_width / 8:
            self.paddle1_x += self.paddle_speed
            
        if self.paddle1_y > ((self.plan_height * 0.85) / 2) or self.paddle1_y < ((-self.plan_height * 0.85) / 2) or \
self.paddle1_x < -(self.plan_width * 0.95) / 2 or self.paddle1_x > -self.plan_width / 8:
            self.paddle1_y = previous_paddle1_y
            self.paddle1_x = previous_paddle1_x
        # if self.ball_y > self.paddle1_y:
        #     self.paddle1_y += self.paddle_speed
        # else:
        #     self.paddle1_y -= self.paddle_speed
        
        # ball_landing_1 = self.predict_ball_landing_y_opponent()
        # if ball_landing_1 is None:
        #     ball_landing_1 = 0.0
        # if self.paddle1_y > ball_landing_1:
        #     self.paddle1_y -= self.paddle_speed
        # else:
        #     self.paddle1_y += self.paddle_speed

        self.reward = 0
        done = self.score1 == 10 or self.score2 == 10
        done = not done
        
        if curr_time - self.last_ai_move_time > self.ai_move_interval or done is None or self.first:
            self.last_ai_move_time = curr_time
            print (f"last_ai_move_time: {self.last_ai_move_time}")
            self.movement = 0
            predict_ball_landing_y = self.predict_ball_landing_y()

            if predict_ball_landing_y is None:
                predict_ball_landing_y = 0.0
            # if self.paddle2_y > predict_ball_landing_y + self.paddle_width / 2:
            #     self.paddle2_y -= self.paddle_speed
            # elif self.paddle2_y < predict_ball_landing_y - self.paddle_width / 2:
            #     self.paddle2_y += self.paddle_speed
            if self.first:
                self.previous_predict_ball_landing_y = predict_ball_landing_y
            # if curr_time - self.last_ai_move_time > self.ai_move_interval:
            previous_predict_ball_landing_y_1 = self.previous_predict_ball_landing_y - ((self.paddle_width / 2) * 0.90)
            previous_predict_ball_landing_y_2 = self.previous_predict_ball_landing_y + ((self.paddle_width / 2) * 0.90)
            self.state = np.array([[self.paddle2_x, self.paddle2_y, self.paddle_speed, self.previous_ball_x, self.previous_ball_y, self.previous_ball_speed, self.previous_ball_dir_x, self.previous_ball_dir_y, previous_predict_ball_landing_y_1, previous_predict_ball_landing_y_2, self.movement]])
            self.state = np.reshape(self.state, [1, self.state_size])
            self.previous_predict_ball_landing_y = predict_ball_landing_y
            # print (f"Predicted ball landing y: {predict_ball_landing_y}")
        self.previous_paddle2_y = self.paddle2_y
        self.previous_paddle2_x = self.paddle2_x
    
        # Add a movement variable to track the movement direction and count for the AI to be restricted to one second (self.moves)
        action = self.agent.act(self.state)
        # action = 1
        # print (f"Action: {action}")
        # Apply the chosen action
        if action == 0 and self.paddle2_y < self.plan_height / 2 - self.paddle_height / 2:  # Move up
            self.paddle2_y += self.paddle_speed
        elif action == 1 and self.paddle2_y > -self.plan_height / 2 + self.paddle_height / 2:  # Move down
            self.paddle2_y -= self.paddle_speed
        
        

        if self.paddle2_y > ((self.plan_height * 0.85) / 2) or self.paddle2_y < ((-self.plan_height * 0.85) / 2)  or \
self.paddle2_x < self.plan_width / 8 or self.paddle2_x > (self.plan_width * 0.95) / 2:
            self.paddle2_y = self.previous_paddle2_y
            self.paddle2_x = self.previous_paddle2_x
        if self.Train:
            if predict_ball_landing_y is 0.0:
                predict_ball_landing_y = self.predict_ball_landing_y()
                if predict_ball_landing_y is None:
                    predict_ball_landing_y = 0.0
            self.reward = self.calculate_reward(predict_ball_landing_y)
            predict_ball_landing_y_1 = predict_ball_landing_y - ((self.paddle_width / 2) * 0.90)
            predict_ball_landing_y_2 = predict_ball_landing_y + ((self.paddle_width / 2) * 0.90)
            self.next_state = np.array([[self.paddle2_x, self.paddle2_y, self.paddle_speed, self.ball_x, self.ball_y, self.ball_speed, self.ball_dir_x, self.ball_dir_y, predict_ball_landing_y_1, predict_ball_landing_y_2, self.movement]])
            self.next_state = np.reshape(self.next_state, [1, self.state_size])
            self.agent.remember(self.state, action, self.reward, self.next_state, done)
            # Train the agent
            if self.first:
                self.first = False
                replay_thread = threading.Thread(target=self.agent.replay)
                replay_thread.start()

        self.first = False
        self.movement += 1

    # Method to update the ball position based on its direction and speed
    def update_ball(self):
        # Update ball position based on its direction and speed
        self.previous_ball_x = self.ball_x
        self.previous_ball_y = self.ball_y
        self.previous_ball_speed = self.ball_speed
        self.previous_ball_dir_x = self.ball_dir_x
        self.previous_ball_dir_y = self.ball_dir_y

        self.ball_x += self.ball_dir_x * self.ball_speed
        self.ball_y += self.ball_dir_y * self.ball_speed

        # Handle ball collision with top and bottom walls (Y-axis bounce)
        if self.ball_y + self.ball_radius > self.plan_height / 2 or self.ball_y - self.ball_radius < -(self.plan_height) / 2:
            self.ball_dir_y = -self.ball_dir_y  # Reverse direction on Y-axis
            if self.ball_speed > 2:
                self.ball_speed *= 0.95  # Slightly reduce speed on each wall bounce

        # Handle ball collision with paddles (X-axis bounce)
        if self.paddle1_x - self.paddle_width <= self.ball_x + self.ball_radius <= self.paddle1_x + self.paddle_width or self.paddle1_x - self.paddle_width <= self.ball_x - self.ball_radius <= self.paddle1_x + self.paddle_width:
        # if self.ball_x + self.ball_radius <= self.paddle1_x + self.paddle_width and self.ball_x >= self.paddle1_x - self.paddle_width:
            if (self.ball_y + self.ball_radius <= self.paddle1_y + self.paddle_height / 2 and self.ball_y + self.ball_radius >= self.paddle1_y - self.paddle_height / 2) \
                or (self.ball_y - self.ball_radius <= self.paddle1_y + self.paddle_height / 2 and self.ball_y - self.ball_radius >= self.paddle1_y - self.paddle_height / 2):
                if self.ball_dir_x < 0:
                    # Calculate new angle based on paddle hit location
                    hit_location = (self.ball_y - self.paddle1_y) / (self.paddle_height / 2)
                    new_angle = math.radians(30 * hit_location)

                    # Update ball direction and speed
                    self.ball_dir_x = -self.ball_dir_x
                    self.ball_dir_y = math.sin(new_angle)
                    self.ball_speed *= 1.1  # Increase speed on paddle hit

        if self.paddle2_x - self.paddle_width <= self.ball_x - self.ball_radius <= self.paddle2_x + self.paddle_width or self.paddle2_x - self.paddle_width <= self.ball_x + self.ball_radius <= self.paddle2_x + self.paddle_width:
        # if self.ball_x + self.ball_radius >= self.paddle2_x - self.paddle_width and self.ball_x <= self.paddle2_x + self.paddle_width:
            if (self.ball_y + self.ball_radius <= self.paddle2_y + self.paddle_height / 2 and self.ball_y + self.ball_radius >= self.paddle2_y - self.paddle_height / 2) \
                or (self.ball_y - self.ball_radius <= self.paddle2_y + self.paddle_height / 2 and self.ball_y - self.ball_radius >= self.paddle2_y - self.paddle_height / 2):
                if self.ball_dir_x > 0:
                    # Calculate new angle based on paddle hit location
                    hit_location = (self.ball_y - self.paddle2_y) / (self.paddle_height / 2)
                    new_angle = math.radians(30 * hit_location)

                    # Update ball direction and speed
                    self.ball_dir_x = -self.ball_dir_x
                    self.ball_dir_y = math.sin(new_angle)
                    self.ball_speed *= 1.1  # Increase speed on paddle hit
                    self.collision2 = True
                    

        # Handle ball out of bounds
        if self.ball_x > (self.plan_width * 0.98) / 2 or self.ball_x < -((self.plan_width * 0.98) / 2):
            if self.ball_x > (self.plan_width * 0.98) / 2:
                self.score1 += 1
                logging.debug(f"Player 1 Scored : {self.score1}")
            else:
                self.score2 += 1
                logging.debug(f"AI Player 2 Scored : {self.score2}")
            self.reset_ball()  # Reset ball if it goes out of bounds

    # Method to reset the ball to the center of the game area
    def reset_ball(self):
        self.ball_x = 0
        self.ball_y = 0
        self.ball_dir_x = -self.ball_dir_x  # Reverse direction for next serve
        self.ball_speed = self.speed
        

    # Method to reset the game state
    def reset_game(self):
        self.score1 = 0
        self.score2 = 0
        self.reset_ball()
        self.paddle1_x = -(self.plan_width * 0.90) / 2
        self.paddle1_y = 0
        self.paddle2_x = (self.plan_width * 0.90) / 2
        self.paddle2_y = 0

    # Method to update the game state
    def update(self, keys):
        self.keys = keys
        self.update_ball()
        self.update_paddles()
        if self.score1 == 10 or self.score2 == 10:
            if self.score1 == 10:
                logging.debug("Player 1 wins")
            else:
                logging.debug("AI Player 2 wins")
            self.reset_game()
    
    # Method to convert game settings to a dictionary
    def to_dict(self):
        return {
            'width': self.width,
            'height': self.height,
            'paddle1_x': self.paddle1_x,
            'paddle1_y': self.paddle1_y,
            'paddle2_x': self.paddle2_x,
            'paddle2_y': self.paddle2_y,
            'ball_x': self.ball_x,
            'ball_y': self.ball_y
        }

# Global variable to store the game instance
game_instance = None

@csrf_exempt
def initialize_game(request):
    print ("Initializing game")
    global game_instance
    if game_instance is not None:
        return JsonResponse({'error': 'Game already initialized. Please reset the game to start again.'})
    if request.method == 'POST':
        # Get the width and height from the request
        dimensions = json.loads(request.body)
        width = dimensions.get('width')
        height = dimensions.get('height')

        # Initialize the game class with these dimensions
        game_instance = Game(width, height)

        print ("Game initialized: ")
        print (game_instance)

        # Respond with a success message or the game settings
        return JsonResponse({'status': 'Game initialized', 'game': game_instance.to_dict()})

@csrf_exempt
def resize_game(request):
    global game_instance
    if game_instance is None:
        return JsonResponse({'error': 'Game not initialized. Please initialize the game first.'})
    if request.method == 'POST':
        # Get the width and height from the request
        dimensions = json.loads(request.body)
        width = dimensions.get('width')
        height = dimensions.get('height')

        # Adjust the game state based on the new dimensions
        game_instance.adjust_game_state(width, height)

        # Respond with the updated game settings
        return JsonResponse(game_instance.to_dict())

@csrf_exempt
def update_game(request):
    global game_instance
    if game_instance is None:
        return JsonResponse({'error': 'Game not initialized. Please initialize the game first.'})
    if request.method == 'POST':
        # Get the key states from the request
        keys = json.loads(request.body)

        # Update the game state with the key states
        game_instance.update(keys)

        # print ("Game updated: ")
        # print (game_instance.ball_dir_x)
        # Respond with the updated game settings
        return JsonResponse(game_instance.to_dict())
