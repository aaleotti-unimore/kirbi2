# coding: utf-8

from __future__ import absolute_import
from __future__ import absolute_import

import auth
import flask_restful
import model
from api import helpers
from main import api_v1
from model import Serie, Issue


@api_v1.resource('/admin/serie/<string:title>/', endpoint='api.admin.serie.title')
class SerieTitleAPI(flask_restful.Resource):
    @auth.admin_required
    def get(self, title):
        serie = Serie.get_by_id(title)
        if not serie:
            helpers.make_not_found_exception('Serie %s not found' % title)

        issues = Issue.query(Issue.serie == serie.key).fetch()
        return helpers.make_response(issues, model.Issue.FIELDS)


@api_v1.resource('/admin/serie/', endpoint='api.admin.serie')
class SerieAPI(flask_restful.Resource):
    @auth.admin_required
    def get(self):
        serie_dbs, cursors = model.Serie.get_dbs()
        return helpers.make_response(serie_dbs, model.Serie.FIELDS, cursors)
