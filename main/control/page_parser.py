# coding: utf-8
"""
This module contains all the logic needed to parse the comics.panini.it store
"""
# coding: utf-8

from __future__ import absolute_import

from datetime import datetime

import httplib
import logging
import traceback
import urllib2
from google.appengine.ext import ndb
from bs4 import BeautifulSoup
from model import Issue, Serie
from flask import Flask

BASE_URL = 'http://comics.panini.it/store/pub_ita_it/magazines/cmc-m.html?limit=25&p=%d'

MIN_PAGE = 1
MAX_PAGE = 10
MAX_PROCESSES = 2

app = Flask(__name__)


class Parser:
    """
    Parses the website page and saves to the database
    """
    logger = logging.getLogger(__name__)
    urls_to_load = []
    min_page = MIN_PAGE
    max_page = MAX_PAGE

    def __init__(self, min_page=MIN_PAGE, max_page=MAX_PAGE):
        if (min_page is not None) and (max_page is not None):
            self.min_page = min_page
            self.max_page = max_page

        for i in range(self.min_page, self.max_page):
            self.urls_to_load.append(BASE_URL % i)

    def parse(self):
        """
        launch a parallel fetch of the pages
        :return: True or False
        """

        issues = []
        for url in self.urls_to_load:
            issues += self.page_parser(url)
        return issues

    def page_parser(self, url):
        """
        parses the single page to collect comics issues
        :param url: page url
        :returns issues: list of dictionaries
        """
        parsed = []  # list of parsed elements
        issues = []

        try:
            data = urllib2.urlopen(url).read()
            app.logger.debug('Fetched %s from %s' % (len(data), url))
            soup = BeautifulSoup(data, 'html.parser')
            issues = soup.find_all('div', attrs={'class': "list-group-item"})  # list of all found comics issues
        except urllib2.HTTPError as e:
            app.logger.error('HTTPError = ' + str(e.code))
        except urllib2.URLError as e:
            app.logger.error('URLError = ' + str(e.reason))
        except httplib.HTTPException as e:
            app.logger.error('HTTPException' + str(e))

        for issue in issues:
            issue_parsed_data = {}

            title = issue.find('h3', class_="product-name").find('a')  # issue title
            issue_parsed_data['title'] = " ".join(title.get_text().split())
            issue_parsed_data['url'] = str(title.get('href'))

            subtitle = issue.find('h3', class_="product-name").find('small',
                                                                    attrs={"class": "subtitle"})  # issue subtitle
            if subtitle:
                issue_parsed_data['subtitle'] = " ".join(subtitle.text.split())

            serie = issue.find('h3', class_="product-name").find('small', attrs={"class": "serie"})  # issue serie
            if serie:
                issue_parsed_data['serie'] = " ".join(serie.text.split())
            else:
                issue_parsed_data['serie'] = "One Shot"

            reprint = issue.find('h5', attrs={"class": "reprint"})  # if reprint
            if reprint:
                issue_parsed_data['reprint'] = " ".join(reprint.text.split())

            date_str = issue.find('h4', class_="publication-date").text.strip()  # publication date
            if date_str:
                struct_date = datetime.strptime(date_str, "%d/%m/%Y")
                issue_parsed_data['date'] = struct_date

            price = issue.find('p', class_="old-price")  # price
            if price:
                issue_parsed_data['price'] = price.text.strip()

            thmb = issue.find('img', class_="img-thumbnail img-responsive")  # issue cover
            if thmb:
                issue_parsed_data['image'] = thmb["src"]

            parsed.append(issue_parsed_data)

        app.logger.debug("Items parsed: %d", len(parsed))
        return parsed

    def parse_issue_summary(self, issue):
        """
        Parses the issue summary

        :param issue: issue
        """
        url = issue.url
        summary = []
        try:
            opened_url = urllib2.urlopen(url, None, 145)
            page = opened_url.read()
            soup = BeautifulSoup(page, 'lxml')
            parsed_description = soup.find('div', attrs={'id': "description"})
            stripped_descr = parsed_description.text.lstrip().rstrip().split(u'\u2022')
            summary = stripped_descr[1:]

        except urllib2.HTTPError as e:
            app.logger.error('HTTPError = ' + str(e.code))
        except urllib2.URLError as e:
            app.logger.error('URLError = ' + str(e.reason))
        except httplib.HTTPException as e:
            app.logger.error('HTTPException' + str(e))
        except Exception:
            app.logger.error('generic exception: ' + traceback.format_exc())

        try:
            issue.summary = summary
            issue.put()
            return True
        except Exception:
            app.logger.error('generic exception: ' + traceback.format_exc())

    def save_issue(self, item):
        """
        Saves the parsed issue into the database

        :param item: parsed issue
        """
        app.logger.debug("saving the issues")
        issue = Issue(id=item['title'])
        issue.title = item['title']
        if 'subtitle' in item:
            if any(word in item['subtitle'] for word in ["variant", "Variant"]):
                issue.key = ndb.Key(Issue, item['title'] + " variant")
                app.logger.debug("found variant, new issue id is " + item['title'] + " variant")
            issue.subtitle = item['subtitle']

        if 'serie' in item:
            keyname = item['serie'].rstrip('1234567890 ')
            serie = Serie.get_or_insert(keyname, title=keyname)
            issue.serie = serie.key

        if 'reprint' in item:
            issue.reprint = item['reprint']

        if 'url' in item:
            issue.url = item['url']

        if 'summary' in item:
            issue.summary = item['summary']

        if 'date' in item:
            issue.date = item['date']

        if 'price' in item:
            issue.price = item['price']

        if "placeholder/default/no-photo" in item['image']:
            issue.image = item['image']
        else:
            issue.image = item['image'].replace('small_image/200x', 'image')

        issue.put_async()
        app.logger.debug("issue " + issue.title + " saved")

    def delete_issue(self, items):
        """
        deletes a collection of items from the database

        :param items: items to delete
        """
        for item in items:
            item.key.delete()
        app.logger.debug("Deleted %d items" % len(items))
