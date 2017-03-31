import asyncio
import websockets

import datetime
import random
import json
import sys

class Game(object):
    def __init__(self):
        self.field = {}
        self.first_player = None
        self.second_player = None
        self.turn = 1
        self.game_offset_x = 0
        self.game_offset_y = 0
        self.events = []
        self.finished = False

    def reset_events(self):
        del self.events[:]

    def add_player(self, player):
        print("Adding player {player} to game {game}".format(player=player, game=self))
        if self.first_player is None:
            self.first_player = player
        else:
            self.second_player = player
        self.send_game_status()
        self.send_field()

    def remove_player(self, player):
        print("Removing player {player} from game {game}".format(player=player, game=self))
        if self.second_player == player:
            self.second_player = None
        elif self.first_player == player:
            self.first_player = self.second_player
            self.second_player = None
        self.send_game_status()

    def switch_turns(self):
        self.turn = 3 - self.turn
        self.send_game_status()

    def is_turn(self, player):
        return self.is_active() and (player == self.first_player and self.turn == 1 or player == self.second_player and self.turn == 2)

    def is_active(self):
        return self.first_player is not None and self.second_player is not None

    def send_to_player(self, player, *events):
        for event in events:
            self.events.append((player, event))

    def send_to_all(self, *events):
        for player in (self.first_player, self.second_player):
            if player is not None:
                self.send_to_player(player, *events)


    def send_game_status(self):
        if self.is_active() and self.turn == 1:
            print("here1")
            self.send_to_player(
                self.second_player,
                {'status': 'Not your turn', 'action': 'status_update'},
            )
            self.send_to_player(
                self.first_player,
                {'status': 'Your turn', 'action': 'status_update'},
            )
        elif self.is_active() and self.turn == 2:
            print("here2")
            self.send_to_player(
                self.first_player,
                {'status': 'Not your turn', 'action': 'status_update'},
            )
            self.send_to_player(
                self.second_player,
                {'status': 'Your turn', 'action': 'status_update'},
            )
        elif not(self.is_active()):
            self.send_to_player(
                self.first_player,
                {'status': 'Waiting for somebody to join', 'action': 'status_update'},
            )

    def send_field(self):
        field = []
        for x in range(10):
            for y in range(10):
                point = (x + self.game_offset_x, y + self.game_offset_y)
                field.append((x, y, self.field.get(point, 0)))
        self.send_to_all(
            {'action': 'update_field', 'field': field}
        )

    def mark_point(self, x, y):
        print("Marking poing x,y in game".format(x=x, y=y, game=self))
        point = (x + self.game_offset_x, y + self.game_offset_y)
        if point not in self.field:
            self.field[point] = self.turn
            self.send_field()
            self.switch_turns()

    def move_left(self):
        self.game_offset_y -= 1
        self.send_field()

    def move_right(self):
        self.game_offset_y += 1
        self.send_field()

    def move_up(self):
        self.game_offset_x -= 1
        self.send_field()

    def move_down(self):
        self.game_offset_x += 1
        self.send_field()


#    def check_finished(self):


class GameController(object):
    def __init__(self):
        self.client_games = {}
        self.single_games = set([])

    def get_game(self, client):
        if client in self.client_games:
            return self.client_games[client]
        else:
            return self.add_client(client)

    def add_client(self, client):
        if len(self.single_games) > 0:
            game = self.single_games.pop()
        else:
            game = Game()
            self.single_games.add(game)
        game.add_player(client)
        self.client_games[client] = game
        return game

    def remove_client(self, client):
        if client in self.client_games:
            game = self.client_games[client]
            if game in self.single_games:
                self.single_games.remove(game)
            else:
                self.single_games.add(game)
            game.remove_player(client)

game_controller = GameController()

async def consumer(message):
    print("I got {message}".format(message=message))

async def consumer_handler(websocket, path):
    while True:
        try:
            message = json.loads(await websocket.recv())
            print("Got message {message}".format(message=message))
            game = game_controller.get_game(websocket)
            if game.is_turn(websocket):
                if message['action'] == 'move_right':
                    game.move_right()
                elif message['action'] == 'move_left':
                    game.move_left()
                elif message['action'] == 'move_up':
                    game.move_up()
                elif message['action'] == 'move_down':
                    game.move_down()
                elif message['action'] == 'mark_point':
                    game.mark_point(int(message['x']), int(message['y']))

            try:
                for (player, event) in game.events:
                    print("Sending event {event} to player {player}".format(event=event, player=player))
                    await player.send(json.dumps(event))
            except:
                pass
            game.reset_events()

            await websocket.send(json.dumps({'action': 'ping'}))
        except:
            print("error:", sys.exc_info()[0])
            game.reset_events()
            game_controller.remove_client(websocket)

            try:
                for (player, event) in game.events:
                    print("Sending event {event} to player {player}".format(event=event, player=player))
                    await player.send(json.dumps(event))
            except:
                pass
            game.reset_events()
            break

start_server = websockets.serve(consumer_handler, '::', 8888)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
