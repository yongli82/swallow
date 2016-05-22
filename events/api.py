#!/usr/bin/env python
# -*- coding:utf-8 -*-

from models import *
# Create your views here.
from collections import OrderedDict
import json
from datetime import *
from Geohash import geohash

from rest_framework.permissions import AllowAny
from rest_framework import mixins
from rest_framework import viewsets
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from django.forms.models import model_to_dict
from django.core import serializers as django_serializers
from django.shortcuts import get_object_or_404

from .serializers import *

# Create a router and register our viewsets with it.
router = DefaultRouter()


class TagViewSet(viewsets.ModelViewSet):
    """
    标签管理(基本方法)
    """
    queryset = CustomizeTag.objects.all()
    serializer_class = TagSerializer
    permission_classes = (AllowAny,)


router.register(r'tags', TagViewSet)


class AddressViewSet(viewsets.ModelViewSet):
    """
    地址管理(基本方法)
    """
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = (AllowAny,)


router.register(r'addresses', AddressViewSet)


class EventViewSet(viewsets.ModelViewSet):
    """
    活动管理(基本方法)
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = (AllowAny,)


router.register(r'events', EventViewSet)


class NestedEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    活动管理(查询)
    """
    queryset = Event.objects.all().order_by('-updated_at')
    serializer_class = NestedEventSerializer
    permission_classes = (AllowAny,)


router.register(r'v2/events', NestedEventViewSet)
