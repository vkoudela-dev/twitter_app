from .models import *
from django.core.paginator import Paginator

#  Check counts of followed users, followers and query all not followed users
def queryUsers(user_id):
        if Follower.objects.filter(user_id=user_id).exists():
            following_instance = Follower.objects.get(user_id=user_id)
            following_users = [following_user.username for following_user in following_instance.followed.all()]
            following_count = following_instance.followed.all().count()
            users = [user for user in User.objects.exclude(pk=user_id) if user.username not in following_users]

        else:
            users = User.objects.exclude(pk=user_id)
            following_users = 0
            following_count = 0
        
        return users, following_users, following_count

#  Create pagination
def paginator(page, tweets):
    tweets_serialized = [tweet.serialize() for tweet in tweets]
    p = Paginator(tweets_serialized, 10)
    tweets_paginated = p.get_page(page)
    num_pages = p.num_pages
    number = tweets_paginated.number

    data = {
        'tweets': [tweet_paginated for tweet_paginated in tweets_paginated],
        'num_pages': num_pages,
        'number': number
    }

    return data