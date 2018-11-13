"""
This module contains the logic for the "user_page.html" temmplate
"""

from google.appengine.ext import ndb

import auth
from flask import request, Flask
from flask_login import current_user
from model import Serie
from profile import profile

from main import app


@app.route('/profile/add_series/', methods=['POST'])
@auth.login_required
def add_user_series():
    """
    Adds requested series in the user's series

    :returns: renders the user page
    """
    my_user = current_user
    app.logger.info(my_user.get)
    series_id = ndb.Key(Serie, request.form['series'])
    if series_id not in my_user.series_list:
        my_user.series_list.append(series_id)
        my_user.put()
        app.logger.debug("user id:" + str(my_user) + " added series: " + request.form['series'])
    return profile()
