#!/usr/bin/env python
# -*- coding:utf-8 -*-

#from __future__ import unicode_literals

#from rest_framework.views import exception_handler

from rest_framework import status
from rest_framework import renderers
from rest_framework import exceptions

def rewrite_reponse(response):
    if response is None:
        return None
    data = response.data
    status_code = response.status_code
    reason_phrase = response.reason_phrase
    # headers = response._headers
    rewrite_data = {
        "status_code": status_code,
        "status_text": reason_phrase,
        "data": data,
    }

    response.status_code = status.HTTP_200_OK
    response.reason_phrase = "OK"
    response.data = rewrite_data

    return response


class JSONRenderer(renderers.JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get("response", None)
        response1 = rewrite_reponse(response)
        if response1:
            data = response1.data
        ret = super(JSONRenderer, self).render(data, accepted_media_type=accepted_media_type,
                                               renderer_context=renderer_context)
        return ret


class DisableCSRF(object):
    """
    Disable csrf check
    @see http://dammit.nl/p/946&view
    https://segmentfault.com/a/1190000000764598
    """
    def process_request(self, request):
        setattr(request, '_dont_enforce_csrf_checks', True)


from rest_framework.filters import DjangoFilterBackend

class AllDjangoFilterBackend(DjangoFilterBackend):
    """
    A filter backend that uses django-filter.
    @see http://stackoverflow.com/questions/27215487/how-to-apply-a-filter-backend-to-all-fields-of-all-resources-in-django-rest-fram
    """

    def get_filter_class(self, view, queryset=None):
        """
        Return the django-filters `FilterSet` used to filter the queryset.
        """
        filter_class = getattr(view, 'filter_class', None)
        filter_fields = getattr(view, 'filter_fields', None)

        if filter_class or filter_fields:
            return super(AllDjangoFilterBackend, self).get_filter_class(self, view, queryset)

        class AutoFilterSet(self.default_filter_set):
            class Meta:
                model = queryset.model
                fields = None

        return AutoFilterSet


import rest_framework.pagination
class PageNumberPagination(rest_framework.pagination.PageNumberPagination):
    # Client can control the page using this query parameter.
    page_query_param = 'page'

    # Client can control the page size using this query parameter.
    # Default is 'None'. Set to eg 'page_size' to enable usage.
    page_size_query_param = 'page_size'

    # Set to an integer to limit the maximum page size the client may request.
    # Only relevant if 'page_size_query_param' has also been set.
    max_page_size = 1000

