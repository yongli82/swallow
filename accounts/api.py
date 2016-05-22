#!/usr/bin/env python
# -*- coding:utf-8 -*-

#!/usr/bin/env python
# -*- coding:utf-8 -*-

from django.http import Http404
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import viewsets
from rest_framework.routers import DefaultRouter
from django.contrib import auth
import logging
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.utils.translation import ugettext_lazy as _
from rest_framework import serializers, exceptions
from rest_framework.authtoken.models import Token
from django.conf import settings

from authtools.models import User

# Create a router and register our viewsets with it.
router = DefaultRouter()

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = "__all__"
        extra_kwargs = {'password': {'write_only': True}, }

    def create(self, validated_data):
        logging.info("begin to create user=%s" % validated_data)
        password = None
        if 'password' in validated_data:
            password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        logging.info("End to create user")
        return user

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        return super(UserSerializer, self).update(instance, validated_data)

class UserViewSet(viewsets.ModelViewSet):
    """
    用户管理
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (AllowAny,)

router.register(r'users', UserViewSet, "user")
