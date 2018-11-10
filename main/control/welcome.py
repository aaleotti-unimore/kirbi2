# coding: utf-8
import random

import flask

import config
from main import app
from model import Issue


###############################################################################
# Welcome
###############################################################################
@app.route('/')
def welcome():
    list_query = Issue.query()
    list_keys = list_query.fetch(keys_only=True)  # maybe put a limit here.

    list_keys = random.sample(list_keys, 20)
    issue_dbs = [list_key.get() for list_key in list_keys]
    # issue_dbs = Issue().query().fetch(limit=10)
    return flask.render_template('welcome.html', html_class='welcome', issue_dbs=issue_dbs)


###############################################################################
# Sitemap stuff
###############################################################################
@app.route('/sitemap.xml')
def sitemap():
    response = flask.make_response(flask.render_template(
        'sitemap.xml',
        lastmod=config.CURRENT_VERSION_DATE.strftime('%Y-%m-%d'),
    ))
    response.headers['Content-Type'] = 'application/xml'
    return response


###############################################################################
# Warmup request
###############################################################################
@app.route('/_ah/warmup')
def warmup():
    # TODO: put your warmup code here
    return 'success'
