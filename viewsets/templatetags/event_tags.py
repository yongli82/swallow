#!/usr/bin/env python
# -*- coding:utf-8 -*-

from __future__ import absolute_import, unicode_literals

from django import template

register = template.Library()


@register.filter
def attr(dict, key):
    try:
        keys = key.split(".")
        obj = dict
        for k in keys:
            obj = getattr(obj, k, "")
        return obj
    except:
        return ""

@register.filter
def mylower(value):
    return value.lower()