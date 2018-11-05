# coding: utf-8

from __future__ import absolute_import

import auth
import config
import flask_restful
import model
from api import helpers
from control import Parser
from main import api_v1


@api_v1.resource('/admin/populate_issues/', endpoint='api.admin.populate_issues')
class PopulateIssuesAPI(flask_restful.Resource):
    # @auth.admin_required
    def get(self):
        parser = Parser()
        issues = parser.parse()
        for issue in issues:
            parser.save_issue(issue)
        return "done"

    # user_keys = util.param('user_keys', list)
    # if user_keys:
    #     user_db_keys = [ndb.Key(urlsafe=k) for k in user_keys]
    #     user_dbs = ndb.get_multi(user_db_keys)
    #     return helpers.make_response(user_dbs, model.User.FIELDS)
    #
    # user_dbs, cursors = model.User.get_dbs(prev_cursor=True)
    # return helpers.make_response(user_dbs, model.User.FIELDS, cursors)

