# coding: utf-8

from __future__ import absolute_import
from __future__ import absolute_import

import auth
import flask_restful
import model
from api import helpers
from control import Parser
from main import api_v1
from model import Issue


@api_v1.resource('/admin/populate_issues/', endpoint='api.admin.populate_issues')
class PopulateIssuesAPI(flask_restful.Resource):
    @auth.admin_required
    def get(self):
        parser = Parser()
        issues = parser.parse()
        for issue in issues:
            parser.save_issue(issue)

        issue_dbs, cursors = model.Issue.get_dbs(prev_cursor=True)
        return helpers.make_response(issue_dbs, model.Issue.FIELDS, cursors)

@api_v1.resource('/admin/issue/<string:title>/', endpoint='api.admin.issue')
class IssueAPI(flask_restful.Resource):
    @auth.admin_required
    def get(self, title):
        issue = Issue.get_by_id(title)
        if not issue:
            helpers.make_not_found_exception('Issue %s not found' % title)

        return helpers.make_response(issue, model.Issue.FIELDS)


@api_v1.resource('/admin/issue/<string:title>/summary/', endpoint='api.admin.issue.summary')
class IssueSummaryAPI(flask_restful.Resource):
    @auth.admin_required
    def get(self, title):
        issue = Issue.get_by_id(title)
        if not issue:
            helpers.make_not_found_exception('Issue %s not found' % title)
        if len(issue.summary) == 0:
            parser = Parser()
            parser.parse_issue_summary(issue)

        return helpers.make_response(issue, model.Issue.FIELDS)