"""Create entrepreneur onboarding and profile foundation tables

Revision ID: 004_entrepreneur_profile_tables
Revises: 003_rule_mandatory_flag
Create Date: 2026-09-07 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_entrepreneur_profile_tables'
down_revision: Union[str, None] = '003_rule_mandatory_flag'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. entrepreneurs table
    op.create_table(
        'entrepreneurs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('gender', sa.String(length=50), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('preferred_language', sa.String(length=20), server_default='en', nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('district', sa.String(length=100), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('pincode', sa.String(length=10), nullable=True),
        sa.Column('area_type', sa.String(length=50), nullable=True),
        sa.Column('latitude', sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column('longitude', sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_entrepreneurs_full_name'), 'entrepreneurs', ['full_name'], unique=False)
    op.create_index(op.f('ix_entrepreneurs_state'), 'entrepreneurs', ['state'], unique=False)

    # 2. business_profiles table
    op.create_table(
        'business_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('entrepreneur_id', sa.Integer(), nullable=False),
        sa.Column('business_name', sa.String(length=255), nullable=True),
        sa.Column('business_type', sa.String(length=100), nullable=True),
        sa.Column('sector', sa.String(length=100), nullable=True),
        sa.Column('sub_sector', sa.String(length=150), nullable=True),
        sa.Column('business_stage', sa.String(length=50), nullable=True),
        sa.Column('business_description', sa.Text(), nullable=True),
        sa.Column('existing_business_vintage_years', sa.Integer(), nullable=True),
        sa.Column('is_greenfield', sa.Boolean(), nullable=True),
        sa.Column('has_vending_proof', sa.Boolean(), nullable=True),
        sa.Column('is_notified_trade', sa.Boolean(), nullable=True),
        sa.Column('is_single_family_applicant', sa.Boolean(), nullable=True),
        sa.Column('has_govt_employee_in_family', sa.Boolean(), nullable=True),
        sa.Column('availed_pmegp_mudra_last_5yr', sa.Boolean(), nullable=True),
        sa.Column('is_non_farm_income_generating', sa.Boolean(), nullable=True),
        sa.Column('is_defaulter', sa.Boolean(), server_default=sa.text('false'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['entrepreneur_id'], ['entrepreneurs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_business_profiles_entrepreneur_id'), 'business_profiles', ['entrepreneur_id'], unique=False)
    op.create_index(op.f('ix_business_profiles_sector'), 'business_profiles', ['sector'], unique=False)

    # 3. financial_profiles table
    op.create_table(
        'financial_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('entrepreneur_id', sa.Integer(), nullable=False),
        sa.Column('business_profile_id', sa.Integer(), nullable=True),
        sa.Column('project_cost', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('own_contribution', sa.Numeric(precision=14, scale=2), server_default=sa.text('0.00'), nullable=True),
        sa.Column('loan_requirement', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('annual_income', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('monthly_income', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('existing_monthly_obligations', sa.Numeric(precision=14, scale=2), server_default=sa.text('0.00'), nullable=True),
        sa.Column('machinery_equipment_cost', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('infrastructure_cost', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('working_capital_cost', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('other_expenses_cost', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['entrepreneur_id'], ['entrepreneurs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['business_profile_id'], ['business_profiles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_financial_profiles_entrepreneur_id'), 'financial_profiles', ['entrepreneur_id'], unique=False)
    op.create_index(op.f('ix_financial_profiles_business_profile_id'), 'financial_profiles', ['business_profile_id'], unique=False)


def downgrade() -> None:
    op.drop_table('financial_profiles')
    op.drop_table('business_profiles')
    op.drop_table('entrepreneurs')
