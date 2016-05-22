#!/usr/bin/env python
# -*- coding:utf-8 -*-

from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings

# UserProfile = get_user_model()


class BaseModel(models.Model):
    memo = models.CharField("备注", help_text="备注", max_length=1024, blank=True)
    created_by = models.CharField("创建者", help_text="创建者", max_length=60, blank=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_by = models.CharField("修改者", help_text="修改者", max_length=60, blank=True)
    updated_at = models.DateTimeField("修改时间", auto_now=True)
    RECORD_STATUS_VALID = 1
    RECORD_STATUS_INVALID = 2
    RECORD_STATUS_CHOICES = (
        (RECORD_STATUS_VALID, "有效"),
        (RECORD_STATUS_INVALID, "无效"),
    )
    record_status = models.IntegerField("状态", choices=RECORD_STATUS_CHOICES, default=RECORD_STATUS_VALID)

    class Meta:
        abstract = True
        ordering = ["-updated_at"]


class CustomizeTag(BaseModel):
    """
    标签
    """
    name = models.CharField("标签", help_text="标签名称", max_length=120)
    content = models.CharField("描述", help_text="标签描述", max_length=1024, blank=True)

    class Meta:
        db_table = "customize_tags"

    def __unicode__(self):
        return self.name


class Address(BaseModel):
    """
    地址
    """
    name = models.CharField("地址", help_text="地址", max_length=300)
    content = models.CharField("描述", help_text="描述", max_length=1024, blank=True)
    country = models.CharField("国家", help_text="国家", max_length=50, default="中国", blank=True)
    province = models.CharField("省份", help_text="省份", max_length=50, blank=True)
    city = models.CharField("城市", help_text="城市", max_length=50, blank=True)
    city_zone = models.CharField("城区", help_text="城区", max_length=50, blank=True)
    longitude = models.CharField("经度", help_text="经度", max_length=50, blank=True)
    latitude = models.CharField("纬度", help_text="纬度", max_length=50, blank=True)
    geohash = models.CharField("GeoHash", help_text="GeoHash", max_length=16, default='', blank=False, db_index=True)

    class Meta:
        db_table = "addresses"

    def __unicode__(self):
        return self.name


class ImageInfo(BaseModel):
    title = models.CharField("标题", help_text="标题", max_length=120, blank=True)
    content = models.TextField("内容", blank=True)
    cover_image = models.CharField("封面图", help_text="封面图", max_length=1024, blank=True, null=True)
    image1 = models.CharField("晒图1", help_text="晒图1", max_length=1024, blank=True, null=True)
    image2 = models.CharField("晒图2", help_text="晒图2", max_length=1024, blank=True, null=True)
    image3 = models.CharField("晒图3", help_text="晒图3", max_length=1024, blank=True, null=True)
    image4 = models.CharField("晒图4", help_text="晒图4", max_length=1024, blank=True, null=True)
    image5 = models.CharField("晒图5", help_text="晒图5", max_length=1024, blank=True, null=True)
    image6 = models.CharField("晒图6", help_text="晒图6", max_length=1024, blank=True, null=True)
    image7 = models.CharField("晒图7", help_text="晒图7", max_length=1024, blank=True, null=True)
    image8 = models.CharField("晒图8", help_text="晒图8", max_length=1024, blank=True, null=True)
    image9 = models.CharField("晒图9", help_text="晒图9", max_length=1024, blank=True, null=True)

    class Meta:
        abstract = True


class Event(ImageInfo):
    """
    活动
    """
    founder = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='event_founder', verbose_name="发起人")
    address = models.ForeignKey(Address, related_name='receiver', verbose_name="地址", blank=True, null=True)
    event_begin_time = models.DateTimeField("活动开始时间", default=timezone.now)
    event_end_time = models.DateTimeField("活动结束时间", default=timezone.now)
    signup_begin_time = models.DateTimeField("报名开始时间", default=timezone.now)
    signup_end_time = models.DateTimeField("报名结束时间", default=timezone.now)
    tags = models.ManyToManyField(CustomizeTag, verbose_name="标签", related_name='event_tags', blank=True, null=True)
    ticket_amount = models.DecimalField("门票价格", help_text="门票价格",
                                        max_digits=12, decimal_places=2, blank=True, null=True)
    participant_limit = models.IntegerField("参与人数限制", help_text="参与人数限制", blank=True, null=True)
    participant_number = models.IntegerField("参与人数", help_text="参与人数", blank=True, null=True)
    transpond_count = models.IntegerField("转发数量", help_text="转发数量", default=0)
    praise_count = models.IntegerField("赞数量", help_text="赞数量", default=0)
    created_time = models.DateTimeField("创建时间", auto_now_add=True)
    updated_time = models.DateTimeField("修改时间", auto_now=True)

    class Meta:
        db_table = "events"

    def __unicode__(self):
        return self.title
