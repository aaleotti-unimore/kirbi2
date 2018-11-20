# coding: utf-8
from google.appengine.ext import ndb

import flask
from control import Parser
from flask import Flask
from model import Issue
import auth
from main import app


@app.route('/issue/<string:title>/')
def issue_page(title):
    issues = Issue.query(Issue.title == title).fetch()
    for issue in issues:
        if len(issue.summary) == 0:
            parser = Parser()
            parser.parse_issue_summary(issue)
    app.logger.info("issue found: %s" % title)
    return flask.render_template('issue_page.html', issues=issues)


@app.route('/purchase_list/add/<string:title>/')
@auth.login_required
def purchase_list_add(title):
    issue = Issue.query(Issue.title == title).get(keys_only=True)
    app.logger.info("%s" % issue)
    user_db = auth.current_user_db()
    if (issue is not None) & (issue not in user_db.purchase_list):
        user_db.purchase_list.append(issue)
        user_db.put()
        app.logger.info("issue found: %s" % title)
    else:
        app.logger.error("issue %s not found" % title)
    return "%s" % user_db.purchase_list


@app.route('/purchase_list/del/<string:title>/')
@auth.login_required
def purchase_list_del(title):
    issue = Issue.query(Issue.title == title).get(keys_only=True)
    user_db = auth.current_user_db()
    if (issue is not None) & (issue in user_db.purchase_list):
        user_db.purchase_list.remove(issue)
        user_db.put()
        app.logger.info("issue removed: %s" % title)
    else:
        app.logger.error("issue %s not found" % title)
    return "%s" % user_db.purchase_list
