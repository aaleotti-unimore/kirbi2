# coding: utf-8

from __future__ import absolute_import, print_function

import logging
from google.appengine.ext import ndb

# create logger
from model import Serie

logger = logging.getLogger(__name__)


class Issue(ndb.Model):
    """
    Single comic issue model
    """
    title = ndb.StringProperty(indexed=True)
    subtitle = ndb.StringProperty(indexed=False)
    series = ndb.KeyProperty(Serie)
    reprint = ndb.StringProperty(indexed=False)
    date = ndb.DateProperty(indexed=True)
    price = ndb.StringProperty(indexed=False)
    image = ndb.StringProperty(indexed=False)
    url = ndb.StringProperty(indexed=False)
    summary = ndb.StringProperty(indexed=False, repeated=True)
