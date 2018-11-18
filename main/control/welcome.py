# coding: utf-8
import datetime
import random
from datetime import timedelta

from google.appengine.ext import ndb

import flask
import auth
import config
from main import app
from model import Issue


###############################################################################
# Welcome
###############################################################################
@app.route('/')
def welcome():
    user_db = auth.current_user_db()
    today = datetime.date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    # list_keys = list_query.fetch(keys_only=True)  # maybe put a limit here.
    #
    # list_keys = random.sample(list_keys, 20)
    # issue_dbs = [list_key.get() for list_key in list_keys]
    current_week = []
    next_weeks = []
    if user_db is not None:
        current_week = Issue.query(
            # ndb.OR(Issue.key.IN(user_db.purchase_list),
            #        ndb.AND(Issue.serie.IN(user_db.series_list),
            #                ndb.AND(Issue.date >= week_start,
            #                        Issue.date <= week_end)
            #                )
            #        )
        ).order(Issue.date).fetch()

        next_weeks = Issue.query(
            # ndb.OR(Issue.key.IN(user_db.purchase_list),
            #        ndb.AND(Issue.serie.IN(user_db.series_list),
            #                Issue.date > week_end
            #                )
            #        )
        ).order(Issue.date).fetch()

    return flask.render_template('welcome.html',
                                 html_class='welcome',
                                 weeks=[current_week, next_weeks],
                                 week_start=week_start,
                                 week_end=week_end)


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
