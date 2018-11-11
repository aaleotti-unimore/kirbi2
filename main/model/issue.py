# coding: utf-8

from __future__ import absolute_import, print_function

from datetime import datetime

import logging
from google.appengine.ext import ndb

import model
from api import fields
from model.serie import Serie


class Issue(model.Base):
    """
    Single comic issue model
    """
    title = ndb.StringProperty(indexed=True, required=True)
    subtitle = ndb.StringProperty(indexed=False)
    serie = ndb.KeyProperty(Serie, required=True, default=ndb.Key('Serie', "One Shot"))
    reprint = ndb.StringProperty(indexed=False)
    date = ndb.DateProperty(indexed=True, default=datetime.today())
    price = ndb.StringProperty(indexed=False)
    image = ndb.StringProperty(indexed=False)
    url = ndb.StringProperty(indexed=False, default="#")
    summary = ndb.StringProperty(indexed=False, repeated=True)
    logger = logging.getLogger(__name__)

    FIELDS = {
        'title': fields.String,
        'subtitle': fields.String,
        'serie': fields.Key,
        'reprint': fields.String,
        'date': fields.DateTime,
        'price': fields.String,
        'image': fields.String,
        'url': fields.String,
        'summary': fields.List(fields.String)
    }

    FIELDS.update(model.Base.FIELDS)
