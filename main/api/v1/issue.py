# coding: utf-8

from __future__ import absolute_import

import flask_restful
import model
import auth
from api import helpers
from control import Parser
from main import api_v1


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
