# Generated by Django 5.1.5 on 2025-01-19 16:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_alter_intra42user_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='intra42user',
            name='first_name',
            field=models.CharField(blank=True, default='', max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='intra42user',
            name='intra_id',
            field=models.CharField(max_length=101, null=True),
        ),
        migrations.AlterField(
            model_name='intra42user',
            name='last_name',
            field=models.CharField(blank=True, default='', max_length=100, null=True),
        ),
    ]
