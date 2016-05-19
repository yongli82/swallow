#!/usr/bin/env python
# -*- coding:utf-8 -*-


from django.views import generic


class HomePage(generic.TemplateView):
    template_name = "home.html"


class AboutPage(generic.TemplateView):
    template_name = "about.html"


class AdminHomePage(generic.TemplateView):
    template_name = "admin/home.html"