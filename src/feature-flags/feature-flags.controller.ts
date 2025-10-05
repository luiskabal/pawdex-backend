import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { AssignFeatureFlagDto, BulkAssignFeatureFlagDto } from './dto/assign-feature-flag.dto';
import { FeatureFlagEntity } from './entities/feature-flag.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Feature Flags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Post()
  @RequirePermissions('feature_flags.create')
  @ApiOperation({ summary: 'Create a new feature flag' })
  @ApiResponse({
    status: 201,
    description: 'Feature flag created successfully',
    type: FeatureFlagEntity,
  })
  @ApiResponse({ status: 409, description: 'Feature flag key already exists' })
  create(@Body() createFeatureFlagDto: CreateFeatureFlagDto) {
    return this.featureFlagsService.create(createFeatureFlagDto);
  }

  @Get()
  @RequirePermissions('feature_flags.read')
  @ApiOperation({ summary: 'Get all feature flags' })
  @ApiResponse({
    status: 200,
    description: 'List of all feature flags',
    type: [FeatureFlagEntity],
  })
  findAll() {
    return this.featureFlagsService.findAll();
  }

  @Get('user/me')
  @ApiOperation({ summary: 'Get current user\'s enabled feature flags' })
  @ApiResponse({
    status: 200,
    description: 'List of feature flag keys enabled for the current user',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['advanced_reporting', 'multi_clinic_support'],
    },
  })
  getCurrentUserFeatureFlags(@Request() req) {
    return this.featureFlagsService.getUserFeatureFlags(req.user.id);
  }

  @Get('user/:userId')
  @RequirePermissions('feature_flags.read')
  @ApiOperation({ summary: 'Get feature flags for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of feature flag keys enabled for the user',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['advanced_reporting', 'multi_clinic_support'],
    },
  })
  getUserFeatureFlags(@Param('userId') userId: string) {
    return this.featureFlagsService.getUserFeatureFlags(userId);
  }

  @Get('check/:key')
  @ApiOperation({ summary: 'Check if current user has access to a specific feature flag' })
  @ApiParam({ name: 'key', description: 'Feature flag key' })
  @ApiResponse({
    status: 200,
    description: 'Whether the user has access to the feature flag',
    schema: {
      type: 'object',
      properties: {
        hasAccess: { type: 'boolean' },
        key: { type: 'string' },
      },
    },
  })
  async checkFeatureFlag(@Param('key') key: string, @Request() req) {
    const hasAccess = await this.featureFlagsService.hasFeatureFlag(req.user.id, key);
    return { hasAccess, key };
  }

  @Get('role/:roleId')
  @RequirePermissions('feature_flags.read')
  @ApiOperation({ summary: 'Get feature flags assigned to a specific role' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'List of feature flags assigned to the role',
  })
  getRoleFeatureFlags(@Param('roleId') roleId: string) {
    return this.featureFlagsService.getRoleFeatureFlags(roleId);
  }

  @Get('key/:key')
  @RequirePermissions('feature_flags.read')
  @ApiOperation({ summary: 'Get feature flag by key' })
  @ApiParam({ name: 'key', description: 'Feature flag key' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag details',
    type: FeatureFlagEntity,
  })
  @ApiResponse({ status: 404, description: 'Feature flag not found' })
  findByKey(@Param('key') key: string) {
    return this.featureFlagsService.findByKey(key);
  }

  @Get(':id')
  @RequirePermissions('feature_flags.read')
  @ApiOperation({ summary: 'Get feature flag by ID' })
  @ApiParam({ name: 'id', description: 'Feature flag ID' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag details',
    type: FeatureFlagEntity,
  })
  @ApiResponse({ status: 404, description: 'Feature flag not found' })
  findOne(@Param('id') id: string) {
    return this.featureFlagsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('feature_flags.update')
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiParam({ name: 'id', description: 'Feature flag ID' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag updated successfully',
    type: FeatureFlagEntity,
  })
  @ApiResponse({ status: 404, description: 'Feature flag not found' })
  @ApiResponse({ status: 409, description: 'Feature flag key already exists' })
  update(@Param('id') id: string, @Body() updateFeatureFlagDto: UpdateFeatureFlagDto) {
    return this.featureFlagsService.update(id, updateFeatureFlagDto);
  }

  @Delete(':id')
  @RequirePermissions('feature_flags.delete')
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiParam({ name: 'id', description: 'Feature flag ID' })
  @ApiResponse({ status: 200, description: 'Feature flag deleted successfully' })
  @ApiResponse({ status: 404, description: 'Feature flag not found' })
  remove(@Param('id') id: string) {
    return this.featureFlagsService.remove(id);
  }

  // Role assignment endpoints
  @Post('assign')
  @RequirePermissions('feature_flags.assign')
  @ApiOperation({ summary: 'Assign a feature flag to a role' })
  @ApiResponse({
    status: 201,
    description: 'Feature flag assigned to role successfully',
  })
  assignToRole(@Body() assignFeatureFlagDto: AssignFeatureFlagDto) {
    return this.featureFlagsService.assignToRole(assignFeatureFlagDto);
  }

  @Post('assign/bulk')
  @RequirePermissions('feature_flags.assign')
  @ApiOperation({ summary: 'Assign multiple feature flags to a role' })
  @ApiResponse({
    status: 201,
    description: 'Feature flags assigned to role successfully',
  })
  bulkAssignToRole(@Body() bulkAssignDto: BulkAssignFeatureFlagDto) {
    return this.featureFlagsService.bulkAssignToRole(bulkAssignDto);
  }

  @Delete('assign/:roleId/:featureFlagId')
  @RequirePermissions('feature_flags.assign')
  @ApiOperation({ summary: 'Remove a feature flag assignment from a role' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({ name: 'featureFlagId', description: 'Feature flag ID' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag assignment removed successfully',
  })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  removeFromRole(
    @Param('roleId') roleId: string,
    @Param('featureFlagId') featureFlagId: string,
  ) {
    return this.featureFlagsService.removeFromRole(roleId, featureFlagId);
  }

  @Get('enabled/:key')
  @RequirePermissions('feature_flags.read')
  @ApiOperation({ summary: 'Check if a feature flag is enabled for a specific role' })
  @ApiParam({ name: 'key', description: 'Feature flag key' })
  @ApiQuery({ name: 'roleId', description: 'Role ID (optional)', required: false })
  @ApiResponse({
    status: 200,
    description: 'Whether the feature flag is enabled',
    schema: {
      type: 'object',
      properties: {
        isEnabled: { type: 'boolean' },
        key: { type: 'string' },
        roleId: { type: 'string' },
      },
    },
  })
  async isFeatureFlagEnabled(
    @Param('key') key: string,
    @Query('roleId') roleId?: string,
  ) {
    const isEnabled = await this.featureFlagsService.isFeatureFlagEnabled(key, roleId);
    return { isEnabled, key, roleId };
  }
}