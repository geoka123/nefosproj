"""
Django management command to seed users (team leaders and members).
Only seeds if no users exist besides superusers.
"""
from django.core.management.base import BaseCommand
from userapi.models import User, Role


class Command(BaseCommand):
    help = 'Seed users (team leaders and members) if database is empty'

    def handle(self, *args, **options):
        # Check if any non-superuser users exist
        non_superusers = User.objects.exclude(is_superuser=True)
        if non_superusers.exists():
            self.stdout.write(
                self.style.WARNING('Users already exist. Skipping seed.')
            )
            return

        self.stdout.write(self.style.SUCCESS('Seeding users...'))

        # Create 2 team leaders
        team_leaders = [
            {
                'email': 'teamleader1@example.com',
                'password': 'teamleader123',
                'first_name': 'John',
                'last_name': 'Leader',
                'role': Role.TEAM_LEADER,
                'is_active': True
            },
            {
                'email': 'teamleader2@example.com',
                'password': 'teamleader123',
                'first_name': 'Jane',
                'last_name': 'Leader',
                'role': Role.TEAM_LEADER,
                'is_active': True
            }
        ]

        for leader_data in team_leaders:
            password = leader_data.pop('password')
            user = User.objects.create_user(**leader_data)
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Created team leader: {user.email}')
            )

        # Create 2 members
        members = [
            {
                'email': 'member1@example.com',
                'password': 'member123',
                'first_name': 'Bob',
                'last_name': 'Member',
                'role': Role.MEMBER,
                'is_active': True
            },
            {
                'email': 'member2@example.com',
                'password': 'member123',
                'first_name': 'Alice',
                'last_name': 'Member',
                'role': Role.MEMBER,
                'is_active': True
            }
        ]

        for member_data in members:
            password = member_data.pop('password')
            user = User.objects.create_user(**member_data)
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Created member: {user.email}')
            )

        self.stdout.write(
            self.style.SUCCESS('\n✓ User seeding completed!')
        )

