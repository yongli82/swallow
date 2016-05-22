#!/usr/bin/env python
# -*- coding:utf-8 -*-

import logging
import json
from Geohash import geohash

from rest_framework import serializers

from .models import *
from accounts.api import UserSerializer
from authtools.models import User

from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser
from django.core import serializers as a
logger = logging.getLogger("app")

BASE_MODEL_EXCLUDE_FIELDS = ("memo", "created_by", "created_at", "updated_by", "updated_at", "record_status")
# Create your views here.
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomizeTag
        exclude = BASE_MODEL_EXCLUDE_FIELDS
        extra_kwargs = {'id': {'read_only': True}}


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        exclude = BASE_MODEL_EXCLUDE_FIELDS
        extra_kwargs = {'id': {'read_only': True}}

    def create(self, validated_data):
        latitude = validated_data.get("latitude")
        if latitude == None or latitude == '':
            raise serializers.ValidationError('未提供纬度')
        longitude = validated_data.get("longitude")
        if longitude == None or longitude == '':
            raise serializers.ValidationError('未提供经度')
        code = geohash.encode(float(latitude), float(longitude))
        validated_data['geohash'] = code
        addr = Address.objects.create(**validated_data)
        return addr

    def update(self, instance, validated_data):
        instance.name = validated_data.get("name")
        instance.content = validated_data.get("content")
        instance.country = validated_data.get("country")
        instance.province = validated_data.get("province")
        instance.city = validated_data.get("city")
        instance.city_zone = validated_data.get("city_zone")
        latitude = validated_data.get("latitude")
        if latitude == None or latitude == '':
            raise serializers.ValidationError('未提供纬度')
        instance.latitude = latitude
        longitude = validated_data.get("longitude")
        if longitude == None or longitude == '':
            raise serializers.ValidationError('未提供经度')
        instance.longitude = longitude
        instance.geohash = geohash.encode(float(latitude), float(longitude))
        instance.save()
        return instance

class EventSerializer(serializers.ModelSerializer):
    founder = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    tags = serializers.PrimaryKeyRelatedField(queryset=CustomizeTag.objects.all(), many=True, required=False)

    class Meta:
        model = Event
        exclude = BASE_MODEL_EXCLUDE_FIELDS
        extra_kwargs = {'id': {'read_only': True}}


class NestedEventSerializer(serializers.ModelSerializer):
    founder = UserSerializer(help_text="创建者")
    address = AddressSerializer()
    tags = TagSerializer(many=True, required=False)

    class Meta:
        model = Event
        exclude = BASE_MODEL_EXCLUDE_FIELDS
        extra_kwargs = {'id': {'read_only': True}}


