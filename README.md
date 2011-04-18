# Intervals

NodeJS wrapper of [Intervals](http://www.myintervals.com) [API](http://www.myintervals.com/api/).

*Work in progress.*

## Install

The best way is to use npm:

    npm install intervals

You can also clone the repository and install dependencies with npm:

    git clone https://github.com/francois2metz/node-intervals.git
    cd node-intervals
    npm bundle

## Dependencies

* node-spore
* node-optimist
* yaml
* futures
* dateformat

## Command line usage

`intervals [add-time] [--date 2011-03-14] [--date 2011-03-13] [--project name] [--hours 4] [--billable] [--description "Hello World"]`

`intervals list-projects`

`intervals --version`

`intervals --help`

### Options

* date: date in ISO 8601 format (YYYY-MM-DD), default *today*. You can set multiple date at the same time.
* hours: default 8
* billable: default non billable
* description: default empty
* project: identifier of the project saved

## API

### Get Spore description

    var desc = require('invervals').description;

### Get client

    var client = require('intervals').createClient('secret token');

## Config

An API key is needed. Go to https://xx.timetask.com/account/api/ and generate one.
The config file is written in ~/.config/intervals or in $XDG_CONFIG_HOME/intervals in yaml format.

## Roadmap

* specify range of date: TODAY..TODAY^ like git
* show table of your time in the current week

## Changelog

* **0.0.6** (not yet released)

  Save project in config file and reuse it after.

* **0.0.5**

  Add --version option.

  Add --help option.

  Add man page. `man intervals`.

* **0.0.4**

  Add short option *-b* for billable hours.

  Use XDG_CONFIG_HOME environment variable for storing config file.

  You can now set multiple date at once with multiple *--date* (thanks [oz](https://github.com/oz/)).

* **0.0.3**

  Options date is now optional. Default is *today*.

  Add missing base64 dependency.

* **0.0.2**

  Add description param.

* **0.0.1**

  Initial release with basic intervals bin.

## Authors

* François de Metz
* Arnaud Berthomier

## License

AGPL v3.
