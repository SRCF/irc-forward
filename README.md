This is a node script that listens to a port on localhost and forwards all
messages to an irc channel. It is a standalone script that does not use any
dependencies, and runs on any node version >= 1. All options are configured via
environmental variables.

This is used in our monitoring setup to forward alerts from monitoring services
to irc.
