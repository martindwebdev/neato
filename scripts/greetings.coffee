# Description:
#  Greet someone!
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   Hubot meet <name>
#
# Author:
#   Martin Dunn - iResources

greetings = [
    "Pleased to meet you!",
    "Welcome to iResources",
    "Aren't I a clever bot?",
]

module.exports = (robot) ->
  robot.respond /meet (.*)/i, (msg) ->

    greeting = "Hello " + msg.match[1].charAt(0).toUpperCase() + msg.match[1].slicee(1) + ". " + msg.random greetings

    msg.send greeting