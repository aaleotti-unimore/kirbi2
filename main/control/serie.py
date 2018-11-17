"""
This module contains the logic for the "user_page.html" temmplate
"""
import logging

from google.appengine.ext import ndb

import auth
from flask import request
from main import app
from model import Serie
from profile import profile

app.logger.setLevel(logging.DEBUG)


@app.route('/profile/add_user_serie/', methods=['POST'])
@auth.login_required
def add_user_serie():
    """
    Adds requested series in the user's series

    :returns: renders the user page
    """
    my_user = auth.current_user_db()
    series_id = ndb.Key(Serie, request.form['serie'])
    if series_id not in my_user.series_list:
        my_user.series_list.append(series_id)
        my_user.put()
        app.logger.debug("user %s added serie: %s" % (str(my_user.name), request.form['serie']))
    else:
        app.logger.debug("%s already in user serie list" % request.form['serie'])
    return profile()


@app.route('/profile/del_user_serie/', methods=['POST'])
@auth.login_required
def del_user_serie():
    """
    remove requested series from the user's series list

    :returns: renders user page
    """
    my_user = auth.current_user_db()
    print("Request form: " + request.form['serie'])
    series_id = ndb.Key(Serie, request.form['serie'])
    print(series_id)
    if series_id in my_user.series_list:
        my_user.series_list.remove(series_id)
        my_user.put()
        app.logger.info("user id:" + str(my_user) + " removed series: " + request.form['serie'])
    return profile()
