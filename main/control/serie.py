"""
This module contains the logic for the "user_page.html" temmplate
"""
import logging

from google.appengine.ext import ndb

import auth
import flask
from flask import request, abort
from main import app
from model import Issue
from model import Serie

app.logger.setLevel(logging.DEBUG)


@app.route('/profile/add_user_serie/', methods=['POST'])
@auth.login_required
def add_user_serie():
    """
    Adds requested series in the user's series
    """
    if not request.form['serie']:
        abort(404)
    my_user = auth.current_user_db()
    series_id = ndb.Key(Serie, request.form['serie'])
    if series_id not in my_user.series_list:
        my_user.series_list.append(series_id)
        my_user.put()
        app.logger.debug("user %s added serie: %s" % (str(my_user.name), request.form['serie']))
    else:
        app.logger.debug("%s already in user serie list" % request.form['serie'])
    return flask.redirect(flask.url_for('profile'))


@app.route('/profile/del_user_serie/', methods=['POST'])
@auth.login_required
def del_user_serie():
    """
    remove requested series from the user's series list
    """
    if not request.form['serie']:
        abort(404)
    my_user = auth.current_user_db()
    series_id = ndb.Key(Serie, request.form['serie'])
    if series_id in my_user.series_list:
        my_user.series_list.remove(series_id)
        my_user.put()
        app.logger.debug("user id:" + str(my_user) + " removed series: " + request.form['serie'])
    return flask.redirect(flask.url_for('profile'))


@app.route('/serie/<string:title>/', methods=['GET'])
@auth.login_required
def serie_page(title):
    user_db = auth.current_user_db()
    serie = []
    if title:
        serie = Issue.query(Issue.serie == ndb.Key(Serie, title)).order(-Issue.date).fetch()
    if not serie:
        abort(404)
    return flask.render_template('serie_page.html', serie=serie, user_db=user_db)


@app.route('/serie/all_series/', methods=['GET'])
@auth.login_required
def all_series():
    user_db = auth.current_user_db()
    issues = []
    series = Serie.query().fetch(keys_only=True)
    if not series:
        abort(404)
    for serie in series:
        serie_5_issues = Issue.query(Issue.serie == serie).order(-Issue.date).fetch(limit=5)
        issues += serie_5_issues

    return flask.render_template('all_series_page.html', series=series, user_db=user_db, issues=issues)

