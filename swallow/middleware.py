#!/usr/bin/env python
# -*- coding:utf-8 -*-

from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect


class RestrictAdminMiddleware(object):
    """
    Restricts access to the admin page to only logged-in users with a certain user-level.
    """
    def process_request(self, request):
        if request.path.startswith("/page/"):
            if not (request.user.is_active and request.user.is_staff):
                return HttpResponseRedirect('/accounts/login/?next=%s' % request.path)