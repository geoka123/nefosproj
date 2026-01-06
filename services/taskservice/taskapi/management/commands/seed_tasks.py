"""
Django management command to seed tasks.
Only seeds if no tasks exist.
Creates 2 tasks per team (one assigned to team leader, one to member).
"""
from django.core.management.base import BaseCommand
from taskapi.models import Task
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Seed tasks if database is empty'

    def handle(self, *args, **options):
        # Check if any tasks exist
        if Task.objects.count() > 0:
            self.stdout.write(
                self.style.WARNING('Tasks already exist. Skipping seed.')
            )
            return

        self.stdout.write(self.style.SUCCESS('Seeding tasks...'))

        # Team and User IDs (based on seeding order):
        # Team 1 (Development Team) - ID 1
        #   - Team Leader 1 (ID 2)
        #   - Member 1 (ID 4)
        # Team 2 (QA Team) - ID 2
        #   - Team Leader 2 (ID 3)
        #   - Member 2 (ID 5)
        # Admin (superuser) - ID 1 (for created_by_user_id)

        # Create tasks for Team 1
        # Task 1: Assigned to Team Leader 1
        task1 = Task(
            title='Implement User Authentication',
            description='Develop and implement secure user authentication system with JWT tokens',
            status='IN_PROGRESS',
            priority='HIGH',
            due_date=datetime.utcnow() + timedelta(days=7),
            created_by_user_id=1,  # Admin
            assigned_to_user_id=2,  # Team Leader 1
            team_id=1
        )
        task1.save()
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created task: {task1.title} (Team 1, assigned to Leader)')
        )

        # Task 2: Assigned to Member 1
        task2 = Task(
            title='Write Unit Tests',
            description='Create comprehensive unit tests for the authentication module',
            status='TODO',
            priority='MEDIUM',
            due_date=datetime.utcnow() + timedelta(days=10),
            created_by_user_id=1,  # Admin
            assigned_to_user_id=4,  # Member 1
            team_id=1
        )
        task2.save()
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created task: {task2.title} (Team 1, assigned to Member)')
        )

        # Create tasks for Team 2
        # Task 3: Assigned to Team Leader 2
        task3 = Task(
            title='Setup CI/CD Pipeline',
            description='Configure continuous integration and deployment pipeline for the project',
            status='IN_PROGRESS',
            priority='HIGH',
            due_date=datetime.utcnow() + timedelta(days=5),
            created_by_user_id=1,  # Admin
            assigned_to_user_id=3,  # Team Leader 2
            team_id=2
        )
        task3.save()
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created task: {task3.title} (Team 2, assigned to Leader)')
        )

        # Task 4: Assigned to Member 2
        task4 = Task(
            title='Perform Security Audit',
            description='Conduct comprehensive security audit of the application',
            status='TODO',
            priority='MEDIUM',
            due_date=datetime.utcnow() + timedelta(days=14),
            created_by_user_id=1,  # Admin
            assigned_to_user_id=5,  # Member 2
            team_id=2
        )
        task4.save()
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created task: {task4.title} (Team 2, assigned to Member)')
        )

        self.stdout.write(
            self.style.SUCCESS('\n✓ Task seeding completed!')
        )

