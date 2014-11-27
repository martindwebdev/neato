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
    msg.send "Hello " + msg.match[1] + ". " + msg.random greetings