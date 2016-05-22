#!/usr/bin/env python
# -*- coding:utf-8 -*-

from rest_framework.filters import DjangoFilterBackend
import rest_framework.pagination

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


class PageNumberPagination(rest_framework.pagination.PageNumberPagination):
    # Client can control the page using this query parameter.
    page_query_param = 'page'

    # Client can control the page size using this query parameter.
    # Default is 'None'. Set to eg 'page_size' to enable usage.
    page_size_query_param = 'page_size'

    # Set to an integer to limit the maximum page size the client may request.
    # Only relevant if 'page_size_query_param' has also been set.
    max_page_size = 1000
    