# coding: utf-8

import flask
from control import Parser

from main import app
from model import Issue


@app.route('/issue/<string:title>/')
def issue_page(title):
    issues = Issue.query(Issue.title == title).fetch()
    for issue in issues:
        if len(issue.summary) == 0:
            parser = Parser()
            parser.parse_issue_summary(issue)
    app.logger.debug("issue found: %s" % title)
    return flask.render_template('issue_page.html', issues=issues)
