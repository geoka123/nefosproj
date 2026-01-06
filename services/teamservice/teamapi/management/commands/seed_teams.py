"""
Django management command to seed teams.
Only seeds if no teams exist.
Creates 2 teams with one team leader and one member each.
"""
from django.core.management.base import BaseCommand
from teamapi.models import Team, TeamUser


class Command(BaseCommand):
    help = 'Seed teams if database is empty'

    def handle(self, *args, **options):
        # Check if any teams exist
        if Team.objects.exists():
            self.stdout.write(
                self.style.WARNING('Teams already exist. Skipping seed.')
            )
            return

        self.stdout.write(self.style.SUCCESS('Seeding teams...'))

        # User IDs from userservice (assuming seeding order):
        # Admin (superuser) - ID 1
        # Team Leader 1 - ID 2
        # Team Leader 2 - ID 3
        # Member 1 - ID 4
        # Member 2 - ID 5

        # Create Team 1
        team1 = Team.objects.create(
            name='Development Team',
            description='Team responsible for software development and implementation'
        )
        self.stdout.write(self.style.SUCCESS(f'✓ Created team: {team1.name}'))

        # Add Team Leader 1 (ID 2) to Team 1
        TeamUser.objects.create(
            team=team1,
            user_id=2,
            user_full_name='John Leader',
            leads_team=True
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Added team leader (ID: 2)'))

        # Add Member 1 (ID 4) to Team 1
        TeamUser.objects.create(
            team=team1,
            user_id=4,
            user_full_name='Bob Member',
            leads_team=False
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Added member (ID: 4)'))

        # Create Team 2
        team2 = Team.objects.create(
            name='QA Team',
            description='Team responsible for quality assurance and testing'
        )
        self.stdout.write(self.style.SUCCESS(f'✓ Created team: {team2.name}'))

        # Add Team Leader 2 (ID 3) to Team 2
        TeamUser.objects.create(
            team=team2,
            user_id=3,
            user_full_name='Jane Leader',
            leads_team=True
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Added team leader (ID: 3)'))

        # Add Member 2 (ID 5) to Team 2
        TeamUser.objects.create(
            team=team2,
            user_id=5,
            user_full_name='Alice Member',
            leads_team=False
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Added member (ID: 5)'))

        self.stdout.write(
            self.style.SUCCESS('\n✓ Team seeding completed!')
        )

