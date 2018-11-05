# coding: utf-8

from __future__ import absolute_import, print_function

import logging
from datetime import datetime
from google.appengine.ext import ndb

# from model import Serie
from model.serie import Serie


class Issue(ndb.Model):
    """
    Single comic issue model
    """
    title = ndb.StringProperty(indexed=True, required=True)
    subtitle = ndb.StringProperty(indexed=False)
    serie = ndb.KeyProperty(Serie, required=True)
    reprint = ndb.StringProperty(indexed=False)
    date = ndb.DateProperty(indexed=True, default=datetime.today())
    price = ndb.StringProperty(indexed=False, default="0")
    image = ndb.StringProperty(indexed=False)
    url = ndb.StringProperty(indexed=False, default="#")
    summary = ndb.StringProperty(indexed=False, repeated=True)
    logger = logging.getLogger(__name__)
