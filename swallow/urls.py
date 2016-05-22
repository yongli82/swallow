"""swallow URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import include, url
from django.contrib import admin

import accounts.urls
import profiles.urls
from . import views
from events.views import url_router as event_urls
from django.views.generic.base import TemplateView
import accounts.api
import events.api

urlpatterns = [
    url(r'^$', views.HomePage.as_view(), name='home'),
    url(r'^admin$', views.AdminHomePage.as_view(), name='admin_home'),
    url(r'^events/', include(event_urls, namespace='events')),
    url(r'^administrator/', include(admin.site.urls)),
    url(r'^users/', include(profiles.urls, namespace='profiles')),
    url(r'^accounts/', include(accounts.urls, namespace='accounts')),
    url(r'^docs/', include('rest_framework_docs.urls')),
    url(r'^api/accounts/', include(accounts.api.router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^api/docs/', include('rest_framework_swagger.urls', namespace='rest_framework_swagger')),
    url(r'^api/$', TemplateView.as_view(template_name="api_index.html"), name='api_index'),
    url(r'^address/$', TemplateView.as_view(template_name="events/address_list.html")),
    url(r'^api/e/', include(events.api.router.urls)),
    url(r'^react/$', TemplateView.as_view(template_name="react.html")),
]
