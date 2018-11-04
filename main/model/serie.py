# coding: utf-8

from __future__ import absolute_import

from google.appengine.ext import ndb


class Serie(ndb.Model):
    """
    Comic series. identifies a group of issues
    """
    title = ndb.StringProperty(indexed=True)
