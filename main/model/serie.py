# coding: utf-8

from __future__ import absolute_import, print_function

from google.appengine.ext import ndb

import model
from api import fields


class Serie(model.Base):
    """
    Comic serie. identifies a group of issues
    """
    title = ndb.StringProperty(indexed=True)

    FIELDS = {
        'title': fields.String
    }

    FIELDS.update(model.Base.FIELDS)
