# coding: utf-8
import auth
import flask
from control import Parser
from flask import request
from flask.json import jsonify
from main import app
from model import Issue


@app.route('/issue/<string:title>/')
def issue_page(title):
    issues = Issue.query(Issue.title == title).fetch()
    for issue in issues:
        if len(issue.summary) == 0:
            parser = Parser()
            parser.parse_issue_summary(issue)
    app.logger.info("issue found: %s" % title)
    return flask.render_template('issue_page.html', issues=issues)


@app.route('/user/buy_list/add/', methods=['POST'])
@auth.login_required
def buy_list_add():
    title = request.form['issue_title']
    issue = Issue.query(Issue.title == title).get(keys_only=True)
    app.logger.info("%s" % issue)
    user_db = auth.current_user_db()
    if (issue is not None) & (issue not in user_db.buy_list):
        user_db.buy_list.append(issue)
        user_db.put()
        app.logger.info("issue added to buy list: %s" % title)
    else:
        app.logger.error("issue %s not found" % title)
    return jsonify(content=user_db.buy_list)


@app.route('/user/buy_list/del/', methods=['POST'])
@auth.login_required
def buy_list_del():
    title = request.form['issue_title']
    issue = Issue.query(Issue.title == request.form['issue_title']).get(keys_only=True)
    user_db = auth.current_user_db()
    if (issue is not None) & (issue in user_db.buy_list):
        user_db.buy_list.remove(issue)
        user_db.put()
        app.logger.info("issue removed from buy list: %s" % title)
    else:
        app.logger.error("issue %s not found" % title)
    return jsonify(content=user_db.buy_list)


@app.route('/user/purchased_list/add/', methods=['POST'])
@auth.login_required
def purchased_list_add():
    title = request.form['issue_title']
    issue = Issue.query(Issue.title == title).get(keys_only=True)
    app.logger.info("%s" % issue)
    user_db = auth.current_user_db()
    if (issue is not None) & (issue not in user_db.purchased_list):
        user_db.purchased_list.append(issue)
        if issue in user_db.buy_list:
            user_db.buy_list.remove(issue)
        user_db.put()
        app.logger.info("issue added to purchased list: %s" % title)
    else:
        app.logger.error("issue %s not found" % title)
    return jsonify(content=user_db.purchased_list)


@app.route('/user/purchased_list/del/', methods=['POST'])
@auth.login_required
def purchased_list_del():
    title = request.form['issue_title']
    issue = Issue.query(Issue.title == title).get(keys_only=True)
    user_db = auth.current_user_db()
    if (issue is not None) & (issue in user_db.purchased_list):
        user_db.purchased_list.remove(issue)
        if issue not in user_db.buy_list:
            user_db.buy_list.add(issue)
        user_db.put()
        app.logger.info("issue removed from purchased list: %s" % title)
    else:
        app.logger.error("issue %s not found" % title)
    return jsonify(content=user_db.purchased_list)
