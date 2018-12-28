# coding: utf-8
import auth
import flask
from control import Parser
from flask import request
from main import app
from model import Issue


@app.route('/issue/<string:title>/')
def issue_page(title):
    issues = Issue.query(Issue.title == title).fetch()
    for issue in issues:
        if len(issue.summary) == 0:
            parser = Parser()
            parser.parse_issue_summary(issue)
    return flask.render_template('issue_page.html', issues=issues)


@app.route('/user/cart', methods=['GET'])
@auth.login_required
def cart_page():
    user_db = auth.current_user_db()
    cart = []
    if user_db.cart:
        cart = Issue.query(Issue.key.IN(user_db.cart)).order(-Issue.date).fetch()
    else:
        flask.abort(404)
    return flask.render_template('cart_page.html', cart=cart, user_db=user_db)


@app.route('/user/cart/add/', methods=['POST'])
@auth.login_required
def cart_add():
    title = request.form['issue_title']

    issue = Issue.query(Issue.title == title).get(keys_only=True)
    app.logger.debug("%s" % issue)
    user_db = auth.current_user_db()
    if (issue is not None) & (issue not in user_db.cart):
        user_db.cart.append(issue)
        user_db.put()
        app.logger.debug("issue added to cart: %s" % title)
    else:
        app.logger.error("user: %s \tissue %s not found" % (user_db.name, title))
    return flask.redirect(flask.url_for('welcome'))


@app.route('/user/cart/del/', methods=['POST'])
@auth.login_required
def cart_del():
    title = request.form['issue_title']
    issue = Issue.query(Issue.title == request.form['issue_title']).get(keys_only=True)
    user_db = auth.current_user_db()
    if (issue is not None) & (issue in user_db.cart):
        user_db.cart.remove(issue)
        user_db.put()
        app.logger.debug("issue removed from buy list: %s" % title)
    else:
        app.logger.error("issue %s not found" % title)
    return flask.redirect(flask.url_for('cart_page'))


@app.route('/user/purchased', methods=['GET'])
@auth.login_required
def purchased_page():
    user_db = auth.current_user_db()
    purchased = []
    if user_db.purchased_list:
        purchased = Issue.query(Issue.key.IN(user_db.purchased_list)).order(-Issue.date).fetch()
    else:
        flask.abort(404)
    return flask.render_template('purchased_page.html', purchased=purchased, user_db=user_db)


@app.route('/user/purchased_list/add/', methods=['POST'])
@auth.login_required
def purchased_list_add():
    title = request.form['issue_title']
    issue = Issue.query(Issue.title == title).get(keys_only=True)
    app.logger.debug("%s" % issue)
    user_db = auth.current_user_db()
    if (issue is not None) & (issue not in user_db.purchased_list):
        user_db.purchased_list.append(issue)
        if issue in user_db.cart:
            user_db.cart.remove(issue)
        user_db.put()
        app.logger.debug("issue added to purchased list: %s" % title)
    else:
        app.logger.error("issue %s not found" % title)
    return flask.redirect(flask.url_for('cart_page'))


@app.route('/user/purchased_list/del/', methods=['POST'])
@auth.login_required
def purchased_list_del():
    title = request.form['issue_title']
    issue = Issue.query(Issue.title == title).get(keys_only=True)
    user_db = auth.current_user_db()
    if (issue is not None) & (issue in user_db.purchased_list):
        user_db.purchased_list.remove(issue)
        user_db.put()
        app.logger.debug("issue removed from purchased list: %s" % title)
    else:
        app.logger.error("issue %s not found" % title)
    return flask.redirect(flask.url_for('purchased_page'))
