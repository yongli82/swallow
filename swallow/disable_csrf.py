#!/usr/bin/env python
# -*- coding:utf-8 -*-

class DisableCSRF(object):
    """
    Disable csrf check
    @see http://dammit.nl/p/946&view
    https://segmentfault.com/a/1190000000764598
    """
    def process_request(self, request):
        setattr(request, '_dont_enforce_csrf_checks', True)
