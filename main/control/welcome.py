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
    user_issues = []
    if user_db is not None:
        if user_db.series_list:
            for serie in user_db.series_list:
                serie_5_issues = Issue.query(Issue.serie == serie).order(-Issue.date).fetch(limit=5)
                user_issues += serie_5_issues
            # if user_db.buy_list:
            #     current_week += Issue.query(Issue.key.IN(user_db.buy_list))
            #
            # next_weeks = Issue.query(
            #     ndb.AND(Issue.serie.IN(user_db.series_list),
            #             Issue.date > week_end
            #             )
            # ).order(Issue.date).fetch()
    # for issue in user_issues:
    #     print(issue.title.encode())
    return flask.render_template('welcome.html',
                                 html_class='welcome',
                                 user_db=user_db,
                                 user_issues=user_issues,
                                 )


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
