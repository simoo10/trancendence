import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .train_model import DQNAgent
import numpy as np
# import tensorflow as tf
import threading
import math
import time
import random


import logging

# Configure the logging
logging.basicConfig(
    filename='replay_debug.log',  # Name of the log file
    level=logging.DEBUG,  # Log all messages (DEBUG and above)
    format='%(asctime)s - %(levelname)s - %(message)s'
)


def random_angle():
    # Define the two ranges
    range1 = (math.pi / 4, math.pi - math.pi / 4)
    range2 = (-math.pi + math.pi / 4, -math.pi / 4)
    
    # Randomly choose which range to use
    if random.random() < 0.5:
        return random.uniform(*range1)
    else:
        return random.uniform(*range2)

# Create a global game instance
game_instance = None

# Create a global agent instance
agent_instance = None

# Create a global lock
lock = threading.Lock()

# class for demonsioons
class Demonsions():
    def __init__(self):
        self.table_x = 0
        self.table_z = 0
        self.table_width = 0.1
        self.table_height = 0.2
        self.player_width = 0.015
        self.player_height = 0.002
        self.player_depth = 0.002
        self.ball_radius = 0.002
        self.left_border_x = self.table_x - self.table_width / 2
        self.right_border_x = self.table_x + self.table_width / 2
        self.top_border_z = self.table_z + self.table_height / 2
        self.bottom_border_z = self.table_z - self.table_height / 2
        self.border_thickness = 0.002
        self.leg_width = 0.02
        self.leg_height = 0.5
        self.leg_depth = 0.02

        # ball and player speed
        self.ball_speed = self.player_height * 0.5
        self.player_speed = self.ball_speed
    
    # Add a method to populate data from a dictionary
    def from_dict(self, data):
        for key, value in data.items():
            setattr(self, key, value)

# Create a class for the player
class Player:
    def __init__(self, demonsions: Demonsions, x, z, name):
        self.x = x
        self.z = z
        self.width = demonsions.player_width
        self.height = demonsions.player_height
        self.depth = demonsions.player_depth
        self.speed = demonsions.player_speed
        self.name = name
        self.init_x = x
        self.init_z = z

        self.username = ""

        self.demonsions = demonsions

        # player's score
        self.score = 0

        # define the borders
        self.left_border = demonsions.left_border_x
        self.right_border = demonsions.right_border_x
        self.top_border = demonsions.top_border_z
        self.bottom_border = demonsions.bottom_border_z

        # define the previous position
        self.prev_x = x
        self.prev_z = z
        
        # variables for the Ai agent
        self.intervalTime = 1
        self.prevTime = 0
        self.collision = False
        self.movement = 0

        # variables for the agent
        self.agent = None
        self.state = None
        self.next_state = None
        self.state = np.array([[self.x, self.z, self.speed, 0, 0, self.speed, 0, 0,0, 0, 0]])
        self.next_state = np.array([[self.x, self.z, self.speed, 0, 0, self.speed, 0, 0, 0, 0, 0]])
        


    def move_up(self):
        self.prev_z = self.z
        self.z -= self.speed

    def move_down(self):
        self.prev_z = self.z
        self.z += self.speed

    def move_left(self):
        self.prev_x = self.x
        self.x -= self.speed
    
    def move_right(self):
        self.prev_x = self.x
        self.x += self.speed

    def get_position(self):
        return self.x, self.z

    def get_dimensions(self):
        return self.width, self.height

    def get_name(self):
        return self.name
    
    def reset_player(self):
        self.x = self.init_x
        self.z = self.init_z
    
    def Boundary(self):
        positive = False if self.z < 0 else True
        if positive:
            if self.x + self.width / 2 >= self.demonsions.right_border_x * 0.985:
                self.x = self.demonsions.right_border_x * 0.985 - self.width / 2
            if self.x - self.width / 2 <= self.demonsions.left_border_x * 0.985:
                self.x = self.demonsions.left_border_x * 0.985 + self.width / 2
            if self.z + (self.height / 2) >= self.demonsions.top_border_z * 0.97:
                self.z = self.demonsions.top_border_z * 0.97 - (self.height / 2)
            if self.z - (self.height / 2) <= (self.demonsions.top_border_z - self.demonsions.bottom_border_z) / 6:
                self.z = ((self.demonsions.top_border_z - self.demonsions.bottom_border_z) / 6) + self.height / 2
        
        else:
            if self.x + self.width / 2 >= self.demonsions.right_border_x * 0.985:
                self.x = self.demonsions.right_border_x * 0.985 - self.width / 2
            if self.x - self.width / 2 <= self.demonsions.left_border_x * 0.985:
                self.x = self.demonsions.left_border_x * 0.985 + self.width / 2
            if self.z + self.height / 2 >= -(self.demonsions.top_border_z - self.demonsions.bottom_border_z) / 6:
                self.z = -(self.demonsions.top_border_z - self.demonsions.bottom_border_z) / 6 - self.height / 2  
            if self.z - self.height / 2 <= self.demonsions.bottom_border_z * 0.97:
                self.z = self.demonsions.bottom_border_z * 0.97 + self.height / 2
    
    
# Create a class for the ball
class Ball:
    def __init__(self, x, z, demonsions: Demonsions, direction):
        self.x = x
        self.z = z
        self.radius = demonsions.ball_radius
        self.speed = demonsions.ball_speed
        
        # Convert initial angle to direction components
        self.direction_x = math.cos(direction)
        self.direction_z = math.sin(direction)

        self.demonsions = demonsions

        # define the borders
        self.left_border = demonsions.left_border_x
        self.right_border = demonsions.right_border_x
        self.top_border = demonsions.top_border_z
        self.bottom_border = demonsions.bottom_border_z

        # define the previous position
        self.prev_x = x
        self.prev_z = z

    def normalize_direction(self):
        """Normalize the direction vector to maintain consistent speed"""
        magnitude = math.sqrt(self.direction_x ** 2 + self.direction_z ** 2)
        if magnitude != 0:
            self.direction_x /= magnitude
            self.direction_z /= magnitude

    def move(self):
        self.prev_x = self.x
        self.prev_z = self.z
        self.x += self.speed * self.direction_x
        self.z += self.speed * self.direction_z

    def get_position(self):
        return self.x, self.z

    def get_radius(self):
        return self.radius
    
    def reset(self):
        self.x = 0
        self.z = 0
        self.speed = self.demonsions.ball_speed
        # Convert random angle to direction components
        angle = random_angle()
        self.direction_x = math.cos(angle)
        self.direction_z = math.sin(angle)
        self.normalize_direction()

# Create a class for the game
class Game:
    def __init__(self, demonsions: Demonsions, names):
        self.demonsions = demonsions
        self.player1 = Player(demonsions, self.demonsions.table_x, self.demonsions.top_border_z * 0.9, names[0])
        self.player2 = Player(demonsions, self.demonsions.table_x, self.demonsions.bottom_border_z * 0.9, names[1])
        self.ball = Ball(self.demonsions.table_x, self.demonsions.table_z, demonsions, random_angle())
        self.first = True
        self.Train = False
        self.predictedBallLanding = 0
        self.PreviousPredictedBallLanding = 0
        self.intervalTime = 0
        self.prevTime = 0
        self.collision = False
        self.movement = 0

        self.WinScore = 5

        self.online = False

        self.countAi = 0

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

        # variables for the agent
        self.agent = None
        self.state = None
        self.next_state = None
        self.action_size = 3
        self.state_size = 11
        self.agent = DQNAgent(self.state_size, self.action_size, self.Train)
        self.state = np.array([[self.player2.x, self.player2.z, self.player2.speed, self.ball.x, self.ball.z, self.ball.speed, self.ball.direction_x, self.ball.direction_z,0, 0, 0]])
        self.next_state = np.array([[self.player2.x, self.player2.z, self.player2.speed, self.ball.x, self.ball.z, self.ball.speed, self.ball.direction_x, self.ball.direction_z, 0, 0, 0]])
        
        self.done = False
        self.reward = 0

        self.username = ""
        self.opponentUsername = ""

        # self.player1.username = self.username
        # self.player2.username = self.opponentUsername

    # Function to predict where the ball will land
    def predictBallLanding(self, player):
        currentx, currentz = self.ball.get_position()
        currentdirection = self.ball.direction_x
        currentspeed = self.ball.speed

        playerx, playerz = player.get_position()

        player1Or2 = 1 if playerx < 0 else 2

        # check if the ball is moving towards the player
        if player1Or2 == 1 and currentdirection > math.pi:
            return 0.0
        elif player1Or2 == 2 and currentdirection < math.pi:
            return 0.0
        
        maxIterations = 1000
        currentIterations = 0

        while currentIterations < maxIterations:
            currentIterations += 1
            currentx += currentspeed * math.cos(currentdirection)
            currentz += currentspeed * math.sin(currentdirection)

            if currentz < self.demonsions.bottom_border_z:
                currentz = self.demonsions.bottom_border_z
                currentdirection = 2 * math.pi - currentdirection
            elif currentz > self.demonsions.top_border_z:
                currentz = self.demonsions.top_border_z
                currentdirection = 2 * math.pi - currentdirection
            elif currentx < self.demonsions.left_border_x:
                currentx = self.demonsions.left_border_x
                currentdirection = math.pi - currentdirection
            elif currentx > self.demonsions.right_border_x:
                currentx = self.demonsions.right_border_x
                currentdirection = math.pi - currentdirection

            # check if the ball crossed the top or down borders
            if currentz <= self.demonsions.bottom_border_z or currentz >= self.demonsions.top_border_z:
                return currentz
        return 0.0
    
    import math

    def predict_ball_landing_z(self, ball_x, ball_z, ball_direction, ball_speed, ball_radius, plan_width, plan_height, paddle_x):
        """
        Predicts the z-position where the ball will reach `paddle_x`, handling out-of-bounds scenarios.

        Parameters:
        - ball_x, ball_z: Current ball position.
        - ball_direction: Direction of the ball in radians (angle from positive x-axis).
        - ball_speed: Speed of the ball.
        - ball_radius: Radius of the ball.
        - plan_width, plan_height: Dimensions of the playing field.
        - paddle_x: The x-coordinate of the target paddle.

        Returns:
        - The predicted z-position of the ball when it reaches `paddle_x`,
        or None if the ball is out of bounds.
        """
        # Calculate direction components from the angle
        ball_dir_x = math.cos(ball_direction)
        ball_dir_z = math.sin(ball_direction)

        current_x = ball_x
        current_z = ball_z
        current_dir_x = ball_dir_x
        current_dir_z = ball_dir_z

        # If the ball is out of bounds, return None
        if current_x > plan_width / 2 or current_x < -plan_width / 2:
            print("Ball out of bounds.")
            return 0.0

        # Define a maximum number of iterations to prevent infinite loops
        max_iterations = 1000
        iteration_count = 0

        while True:
            iteration_count += 1
            if iteration_count > max_iterations:
                # Break the loop if something goes wrong to avoid infinite loops
                print("Exceeded maximum iterations; returning 0.0 to prevent infinite loop.")
                return 0.0

            # Calculate the time to reach paddle_x
            if current_dir_x >= 0:
                time_to_paddle = (paddle_x - current_x) / (current_dir_x * ball_speed)
            else:
                return 0.0  # Ball is moving away from the paddle

            # If no bounce occurs before reaching paddle_x, calculate final z
            next_z = current_z + current_dir_z * ball_speed * time_to_paddle
            if next_z + ball_radius <= plan_height / 2 and next_z - ball_radius >= -plan_height / 2:
                return next_z

            # Handle bounces off the top or bottom walls
            if current_dir_z > 0:
                time_to_wall = ((plan_height / 2 - ball_radius) - current_z) / (current_dir_z * ball_speed)
            else:
                time_to_wall = ((-plan_height / 2 + ball_radius) - current_z) / (current_dir_z * ball_speed)

            # Update ball position and direction after bouncing off the wall
            current_x += current_dir_x * ball_speed * time_to_wall
            current_z += current_dir_z * ball_speed * time_to_wall
            current_dir_z = -current_dir_z  # Reverse z-direction on bounce
    
    #Predict Ball Landing 3
    def predict_ball_landing_2(self, ball: Ball, table_width, table_height, max_iterations=1000):
        """
        Recursively predict where the ball will land on the table.
        
        :param ball: Ball object with x, y, speed, direction (in radians), and radius
        :param table_width: Width of the Pong table
        :param table_height: Height of the Pong table
        :param max_iterations: Maximum number of bounces to consider
        :return: Predicted x-coordinate of the ball's landing point
        """
        def predict_landing_recursive(x, y, direction, remaining_iterations):
            # If no more iterations or ball is unlikely to bounce, return current x
            if remaining_iterations <= 0:
                return x
            
            # Calculate next position
            new_x = x + ball.speed * math.cos(direction)
            new_y = y + ball.speed * math.sin(direction)
            
            # Check for vertical wall bounces
            if new_x <= ball.radius or new_x >= table_width - ball.radius:
                # Reflect horizontally
                direction = math.pi - direction
                
                # Adjust x to be within table bounds
                new_x = max(ball.radius, min(new_x, table_width - ball.radius))
            
            # Check for horizontal wall bounces
            if new_y <= ball.radius or new_y >= table_height - ball.radius:
                # Reflect vertically
                direction = -direction
                
                # Adjust y to be within table bounds
                new_y = max(ball.radius, min(new_y, table_height - ball.radius))
            
            # Recursive call with updated parameters
            return predict_landing_recursive(new_x, new_y, direction, remaining_iterations - 1)
        
        # Initial call to recursive function
        return predict_landing_recursive(ball.x, ball.z, ball.direction, max_iterations)
    


    def predict_ball_landing(self, ball: Ball, player: Player, max_iterations=1000):
        """
        Predict where the ball will land using directional components
        """
        x = ball.x
        z = ball.z
        direction_x = ball.direction_x
        direction_z = ball.direction_z
        speed = ball.speed

        for _ in range(max_iterations):
            # Calculate next position
            new_x = x + speed * direction_x
            new_z = z + speed * direction_z

            # Check for vertical wall bounces (left and right walls)
            if new_x <= self.demonsions.left_border_x * 0.95:
                new_x = self.demonsions.left_border_x * 0.95
                direction_x *= -1
                if speed >= self.demonsions.ball_speed:
                    speed *= 0.95
            elif new_x >= self.demonsions.right_border_x * 0.95:
                new_x = self.demonsions.right_border_x * 0.95
                direction_x *= -1
                if speed >= self.demonsions.ball_speed:
                    speed *= 0.95

            # Check for horizontal wall bounces (top and bottom walls)
            if new_z <= self.demonsions.bottom_border_z * 0.97:
                new_z = self.demonsions.bottom_border_z * 0.97
                direction_z *= -1
            elif new_z >= self.demonsions.top_border_z * 0.97:
                new_z = self.demonsions.top_border_z * 0.97
                direction_z *= -1
            
            # Update position
            x = new_x
            z = new_z
            
            # Check if z is within the player's width
            if z <= player.z + self.demonsions.player_height / 2 and z >= player.z - self.demonsions.player_height / 2:
                return x
        
        return x

    # Corrected function to handle potential z attribute error
    def safe_predict_ball_landing(self, ball: Ball, player:Player, max_iterations=1000):
        """
        Safe wrapper for predict_ball_landing to handle potential attribute errors.
        """
        try:
            # Attempt to use x and y
            return self.predict_ball_landing(ball, player, max_iterations)
        except AttributeError:
            print("Error: Could not find x coordinate for the ball")
            return 0.0

    # lets check this function later when done with the rest of the code

    def isIdele(self, player):
        return math.sqrt((player.prev_x - player.x) ** 2 + (player.prev_z - player.z) ** 2) < 0.1
    

    # calculate Reward for the Ai agent action when being trained
    # def calculateReward(self, player: Player, predictedBallLanding):
    #     reward = 0

    #     betweenBallAndPlayer = math.sqrt((self.ball.x - player.x) ** 2 + (self.ball.z - player.z) ** 2)
    #     # Base position Reward
    #     if betweenBallAndPlayer < self.demonsions.player_height:
    #         distanceToCenter = player.x
    #         # distanceToCenter = math.sqrt((0 - player.x) ** 2 + (0 - player.z) ** 2)
    #         reward -= distanceToCenter * 0.01
        
    #     # Ball position Reward
    #     if self.collision:
    #         reward += 2
    #         # self.collision = False
        
    #     # Positioning Reward
    #     else:
    #         if (abs(predictedBallLanding - (player.x - self.demonsions.player_width / 2) * 0.90) > abs(predictedBallLanding - (player.prev_x - self.demonsions.player_width / 2) * 0.90)) and \
    #             (abs(predictedBallLanding - (player.x + self.demonsions.player_width / 2) * 0.90) > abs(predictedBallLanding - (player.prev_x + self.demonsions.player_width / 2) * 0.90)): 
    #             reward -= 1
    #             if self.isIdele(player):
    #                 reward -= 0.1
    #         else:
    #             if abs(predictedBallLanding - (player.x)) == abs(predictedBallLanding - (player.prev_x)) and (player.x > predictedBallLanding + (self.demonsions.player_width / 2) * 0.90 or player.x < predictedBallLanding - ((player.demonsions.player_width / 2) * 0.90)):
    #                 reward -= 0.1
    #             else:
    #                 reward += 1
            
    #         # Pnalty for letting the ball pass
    #         if self.ball.z < self.demonsions.bottom_border_z * 0.97 or self.ball.z < player.z:
    #             reward -= 1.0
    #         elif self.ball.z > self.demonsions.top_border_z * 0.97:
    #             reward += 1.0
            
    #     # Reward for Winning
    #     if player.score == self.WinScore:
    #         reward += 1.0

    #     return reward
    def calculateReward(self, player: Player, predictedBallLanding):
        """
        Enhanced reward function that considers directional components and provides
        more nuanced feedback for the AI agent's learning.
        """
        reward = 0
        ball = self.ball
        dimensions = self.demonsions

        # 1. Ball Interception Positioning (0-3 points)
        ball_distance = abs(player.x - predictedBallLanding)
        paddle_coverage = dimensions.player_width
        
        if ball_distance <= paddle_coverage / 4:  # Perfect positioning
            reward += 3.0
        elif ball_distance <= paddle_coverage / 2:  # Very good positioning
            reward += 2.0
        elif ball_distance <= paddle_coverage:  # Acceptable positioning
            reward += 1.0
        else:  # Poor positioning
            reward -= 1.0 * (ball_distance / paddle_coverage)  # Scaled penalty

        # 2. Movement Optimization (-1 to 1 points)
        movement_efficiency = abs(player.x - player.prev_x)
        target_movement = abs(predictedBallLanding - player.prev_x) / 10  # Ideal movement per step
        
        if movement_efficiency <= target_movement:
            reward += 1.0  # Efficient movement
        else:
            reward -= (movement_efficiency - target_movement) * 2  # Penalty for excessive movement

        # 3. Ball Direction Anticipation (-2 to 2 points)
        # Reward for anticipating ball's trajectory
        approaching_player = (ball.direction_z * player.z) > 0  # Ball moving towards player
        if approaching_player:
            direction_anticipation = abs(ball.direction_x) * (1 - abs(player.x - ball.x) / dimensions.table_width)
            reward += direction_anticipation * 2

        # 4. Collision Quality (0-4 points)
        if self.collision:
            # Better collision detection using directional components
            hit_position = (ball.x - player.x) / (dimensions.player_width / 2)
            hit_velocity = math.sqrt(ball.direction_x**2 + ball.direction_z**2)
            
            # Reward for central hits and good deflection angles
            central_hit_bonus = 1 - abs(hit_position)
            velocity_bonus = min(hit_velocity, 1.0)
            
            reward += 2.0 * central_hit_bonus  # Up to 2 points for central hit
            reward += 2.0 * velocity_bonus     # Up to 2 points for good deflection

        # 5. Strategic Positioning (-2 to 2 points)
        # Encourage staying near the center when ball is far
        ball_distance_to_player = math.sqrt((ball.x - player.x)**2 + (ball.z - player.z)**2)
        if ball_distance_to_player > dimensions.table_height / 2:
            center_position = 1 - abs(player.x) / (dimensions.right_border_x / 2)
            reward += center_position * 2
        
        # 6. Ball Speed Management (-1 to 1 points)
        # Reward for maintaining appropriate ball speed
        optimal_speed_range = (dimensions.ball_speed, dimensions.ball_speed * 1.5)
        if optimal_speed_range[0] <= ball.speed <= optimal_speed_range[1]:
            reward += 1.0
        else:
            reward -= abs(ball.speed - dimensions.ball_speed) / dimensions.ball_speed

        # 7. Game Progress Rewards
        # Scoring
        if player.score > 0:
            reward += player.score * 1.0  # Progressive reward for scoring

        # 8. Critical Events
        # Severe penalties for losing points
        if ball.z < dimensions.bottom_border_z * 0.97:
            reward -= 5.0  # Increased penalty for missing ball
        
        # 9. Win Condition
        if player.score == self.WinScore:
            reward += 15.0  # Major reward for winning game

        # 10. Recovery Behavior
        # Reward for recovering from bad positions
        if abs(player.prev_x) > abs(player.x):  # Moving towards center
            recovery_factor = abs(player.prev_x) - abs(player.x)
            reward += recovery_factor * 0.5

        # 11. Direction Control Bonus
        # Reward for maintaining good directional control
        direction_magnitude = math.sqrt(ball.direction_x**2 + ball.direction_z**2)
        if 0.9 <= direction_magnitude <= 1.1:  # Close to normalized
            reward += 0.5

        # Normalize final reward
        reward = max(min(reward, 10.0), -10.0)

        # print ("reward = ", reward)
        
        return reward
    # Function to check if the ball hit the player
    def check_collision(self, ball: Ball, player: Player):
        """
        Checks if the ball hits the given player.
        
        :param ball: An object with `x`, `z`, and `radius` attributes representing the ball's center and size.
        :param player: An object with `x`, `z`, `width`, and `height` attributes representing the player's size and position.
        :return: True if there's a collision, False otherwise.
        """
        # Calculate player's bounding box extended by the ball's radius
        highest_z = (player.z + player.height / 2 + ball.radius)
        smallest_z = (player.z - player.height / 2 - ball.radius)
        highest_x = (player.x + player.width                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     / 2 + ball.radius)
        smallest_x = (player.x - player.width / 2 - ball.radius)

        # Check if ball's center is within the extended bounding box
        is_within_z = smallest_z <= ball.z <= highest_z
        is_within_x = smallest_x <= ball.x <= highest_x

        return is_within_z and is_within_x

    # Function to calculate new angle of the ball
    def handle_collision(self, ball: Ball, player: Player):
        """
        Adjusts the ball's direction based on where it hits the paddle.

        :param ball: An object with `x`, `z`, `radius`, `speed`, and `direction` attributes.
        :param player: An object with `x`, `z`, `width`, and `height` attributes, plus optional `velocity` for paddle motion.
        :return: None (modifies ball in place).
        """
        # Calculate the relative hit position on the paddle (-1 to 1 scale)
        relative_hit = (ball.x - player.x) / (player.width / 2)

        # Limit relative_hit to the paddle bounds (-1 to 1)
        print ("1---", relative_hit)
        relative_hit = max(-1, min(1, relative_hit))
        print (relative_hit)

        # Adjust the ball's angle based on the hit position
        max_angle = math.radians(75)  # Max rebound angle from the paddle
        new_angle = relative_hit * max_angle

        # Optional: Add spin/boost based on paddle velocity (if applicable)
        if hasattr(player, 'velocity'):
            new_angle += player.velocity * 0.1  # Add small influence from paddle motion

        # Calculate the new direction
        ball.direction = new_angle

        # Adjust ball speed slightly based on where it hit (optional)
        ball.speed *= 1.1 if abs(relative_hit) > 0.7 else 1.0  # Increase speed for edge hits

    import math

    def bounce_ball_from_player(self, ball:Ball, player:Player):
        # Check if the ball's x is within the player's x range
        player_left_boundary = player.x - player.width / 2
        player_right_boundary = player.x + player.width / 2
            
        # Calculate relative intersection point on the player
        relative_intersect_x = (player.x + (player.width / 2)) - ball.x
        
        # Normalize the intersection point
        max_bounce_angle = math.pi / 4  # 45 degrees
        
        # Calculate bounce angle based on where the ball hits the player
        # Negative because we want left side of paddle to bounce up, right side to bounce down
        bounce_angle = -(relative_intersect_x / (player.width / 2)) * max_bounce_angle
        
        # Current ball speed
        current_speed = ball.speed
        
        # Calculate new direction
        # Reflect the current direction and add the bounce angle
        new_direction = math.pi - ball.direction + 2 * bounce_angle
        
        # Ensure the new direction is within [0, 2π]
        new_direction = new_direction % (2 * math.pi)
        
        # Update ball properties
        ball.direction = new_direction
        
        # increase speed on player hit
        ball.speed *= 1.1 
        
        return True

    def handle_collision_1(self, player: Player, ball: Ball):
        # Get the player's position and dimensions
        player_x, player_z = player.get_position()
        player_width, player_height = player.get_dimensions()
        
        # Get the ball's position and radius
        ball_x, ball_z = ball.get_position()
        ball_radius = ball.get_radius()
        
        # Calculate hit position relative to the center of the paddle (-1 to 1)
        hit_pos_x = (ball_x - player_x) / (player_width / 2)
        hit_pos_z = (player_z - ball_z) / (ball_radius / 2)

        # Calculate new direction components
        # Reverse z direction and add influence from hit position
        ball.direction_z *= -1
        # Add some horizontal influence based on where the ball hit the paddle
        ball.direction_x += hit_pos_x * 0.5  # Adjust multiplier to control effect strength
        
        # Normalize the direction vector
        ball.normalize_direction()
        
        # Optional: Increase the ball's speed slightly
        ball.speed *= 1.05


    # Function to move the ball
    def moveBall(self):
        self.ball.move()

        # Check if the ball crossed the left or right borders
        if self.ball.x <= self.demonsions.left_border_x * 0.95:
            self.ball.x = self.demonsions.left_border_x * 0.95
            self.ball.direction_x *= -1  # Reverse x direction
            if self.ball.speed >= self.demonsions.ball_speed:
                self.ball.speed *= 0.95
        elif self.ball.x >= self.demonsions.right_border_x * 0.95:
            self.ball.x = self.demonsions.right_border_x * 0.95
            self.ball.direction_x *= -1  # Reverse x direction
            if self.ball.speed >= self.demonsions.ball_speed:
                self.ball.speed *= 0.95

        # Check if the ball crossed the top or bottom borders
        if self.ball.z <= self.demonsions.bottom_border_z * 0.97:
            self.ball.z = self.demonsions.bottom_border_z * 0.97
            self.player1.score += 1
            # print("player1 scored : ", self.player1.score)
            self.ball.reset()
        elif self.ball.z >= self.demonsions.top_border_z * 0.97:
            self.ball.z = self.demonsions.top_border_z * 0.97
            self.player2.score += 1
            # print("player2 scored : ", self.player2.score)
            self.ball.reset()
        
        # Handle paddle collisions
        if self.check_collision(self.ball, self.player1):
            if not self.collision:
                self.handle_collision_1(self.player1, self.ball)
                self.collision = True
            while self.check_collision(self.ball, self.player1):
                self.ball.move()
        elif self.check_collision(self.ball, self.player2):
            if not self.collision:
                self.handle_collision_1(self.player2, self.ball)
                self.collision = True
            while self.check_collision(self.ball, self.player2):
                self.ball.move()
        else:
            self.collision = False



    # Function to move the player by Ai agent
    def moveAIPlayer(self, player:Player, currTime):
        if player.name == "AI":
            if currTime - self.prevTime >= 1 or self.first:
                self.predictedBallLanding = self.predictBallLanding(player)
                self.prevTime = currTime
                player.movement = 0
                self.state = np.array([[player.x, player.z, player.speed, self.ball.prev_x, self.ball.prev_z, self.ball.speed, self.ball.direction_x, self.ball.direction_z, self.predictedBallLanding - self.demonsions.player_width, self.predictedBallLanding + self.demonsions.player_width, player.movement]])
                self.state = np.reshape(self.state, [1, self.state_size])
                # print ("state = ", self.state)
            if self.countAi % 5 == 0 or self.first:
                action = self.agent.act(self.state)
                # if action == 0:
                #     player.move_up()
                # elif action == 1:
                #     player.move_down()
                if action == 0:
                    player.move_right()
                elif action == 1:
                    player.move_left()

                # check if the player didnt cross the borders
                player.Boundary()

                # calculate the reward
                if self.Train:
                    self.next_state = np.array([[player.x, player.z, player.speed, self.ball.x, self.ball.z, self.ball.speed, self.ball.direction_x, self.ball.direction_z, self.predictedBallLanding - self.demonsions.player_width, self.predictedBallLanding + self.demonsions.player_width, player.movement]])
                    self.next_state = np.reshape(self.next_state, [1, self.state_size])
                    self.reward = self.calculateReward(player, self.predictedBallLanding)
                    self.agent.remember(self.state, action, self.reward, self.next_state, self.done)
                    self.agent.replay() # internally iterates default (prediction) model
                    # if self.first:
                    #     replay_thread = threading.Thread(target=self.agent.replay)
                    #     print ("creating replay thread")
                    #     replay_thread.start()

                self.first = False
                player.movement += 1
            self.countAi += 1
    
    def moveBotPlayer(self, player:Player):
        # ballLand = self.predictBallLanding(player)
        # # ballLand = self.predict_ball_landing_z(self.ball.x, self.ball.z, self.ball.direction, self.ball.speed, self.demonsions.ball_radius, self.demonsions.table_width, self.demonsions.table_height, player.x)
        # print ("1-", ballLand)

        ballLand = self.safe_predict_ball_landing(self.ball, player)
        # print ("2-", ballLand)

        # ballLand = self.ball.x
        # if ballLand == 0.0:
        #     return
        if player.x < ballLand:
            player.move_right()
        elif player.x > ballLand:
            player.move_left()
        player.Boundary()
        return

    def moveWSDAHumanPlayer(self, player):
        if self.keys["UpKey1"]:
            player.move_up()
        if self.keys["DownKey1"]:
            player.move_down()
        if self.keys["LeftKey1"]:
            player.move_left()
        if self.keys["RightKey1"]:
            player.move_right()

        # check if the player didnt cross the borders
        player.Boundary()

        
    def moveArrowsHumanPlayer (self, player):
        if self.keys["UpKey2"]:
            player.move_up()
        if self.keys["DownKey2"]:
            player.move_down()
        if self.keys["LeftKey2"]:
            player.move_left()
        if self.keys["RightKey2"]:
            player.move_right()

        # check if the player didnt cross the borders
        player.Boundary()
    
    def movePlayerTest(self, player):
        # just a Testing function
        if self.ball.x > player.x:
            player.move_right()
        elif self.ball.x < player.x:
            player.move_left()

        player.Boundary()



    # Function to move the player
    def movePlayer(self):
        currTime = time.time()

        for player in [self.player1, self.player2]:
            # self.movePlayerTest(player)
            # continue
            if player.name == "AI":
                self.moveAIPlayer(player, currTime)
            elif player.name == "Bot" or self.Train == True:
                self.moveBotPlayer(player)
            elif player.name == "Player1":
                self.moveWSDAHumanPlayer(player)
            elif player.name == "Player2":
                self.moveArrowsHumanPlayer(player)
        
    def resetGame(self):
        self.player1.reset_player()
        self.player1.score = 0

        self.player2.reset_player()
        self.player2.score = 0

        self.ball.reset()


    # Function to update the game
    def update(self, keys):
        self.keys = keys
        self.moveBall()
        if self.player1.score == self.WinScore or self.player2.score == self.WinScore:
            self.done = True
        self.movePlayer()
        self.done = False
        if self.player1.score == self.WinScore or self.player2.score == self.WinScore:
            self.done = True
            if self.Train: self.resetGame()
    
    # Function to get the game state
    def get_state(self):
        if self.done == True and self.Train == False:
            return {
                "type": "game_over",
                "player1": {
                    "score": self.player1.score
                },
                "player2": {
                    "score": self.player2.score
                },
                "winner": "player1" if self.player1.score > self.player2.score else "player2",
                "winner_username": self.username if self.player1.score > self.player2.score else self.opponentUsername,
                "loser_username": self.opponentUsername if self.player1.score > self.player2.score else self.username,
                "winner_score": self.player1.score if self.player1.score > self.player2.score else self.player2.score,
                "loser_score": self.player2.score if self.player1.score > self.player2.score else self.player1.score,
                "message": f"{self.username} won the game" if self.player1.score > self.player2.score else f"{self.opponentUsername} won the game"
            }            
        else:
            return {
                "type": "game_state",
                "player1": {
                    "x": self.player1.x,
                    "z": self.player1.z,
                    "score": self.player1.score
                },
                "player2": {
                    "x": self.player2.x,
                    "z": self.player2.z,
                    "score": self.player2.score
                },
                "ball": {
                    "x": self.ball.x,
                    "z": self.ball.z
                }
            }
