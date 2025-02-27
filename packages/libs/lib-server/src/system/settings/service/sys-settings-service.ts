import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { SysSettingsEntity } from '../entity/sys-settings.js';
import { CacheManager } from '@midwayjs/cache';
import { BaseSettings, SysInstallInfo, SysPrivateSettings, SysPublicSettings, SysSecretBackup } from './models.js';
import * as _ from 'lodash-es';
import { BaseService } from '../../../basic/index.js';
import { logger, setGlobalProxy } from '@certd/basic';
import { agents } from '@certd/acme-client';
/**
 * 设置
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysSettingsService extends BaseService<SysSettingsEntity> {
  @InjectEntityModel(SysSettingsEntity)
  repository: Repository<SysSettingsEntity>;

  @Inject()
  cache: CacheManager; // 依赖注入CacheManager

  getRepository() {
    return this.repository;
  }
  async getById(id: any): Promise<SysSettingsEntity | null> {
    const entity = await this.info(id);
    if (!entity) {
      return null;
    }
    const setting = JSON.parse(entity.setting);
    return {
      id: entity.id,
      ...setting,
    };
  }

  async getByKey(key: string): Promise<SysSettingsEntity | null> {
    if (!key) {
      return null;
    }
    return await this.repository.findOne({
      where: {
        key,
      },
    });
  }

  async getSettingByKey(key: string): Promise<any | null> {
    const entity = await this.getByKey(key);
    if (!entity) {
      return null;
    }
    return JSON.parse(entity.setting);
  }

  async save(bean: SysSettingsEntity) {
    const entity = await this.repository.findOne({
      where: {
        key: bean.key,
      },
    });
    if (entity) {
      entity.setting = bean.setting;
      await this.repository.save(entity);
    } else {
      bean.title = bean.key;
      await this.repository.save(bean);
    }
  }

  async getSetting<T>(type: any): Promise<T> {
    const key = type.__key__;
    const cacheKey = type.getCacheKey();
    const settings: T = await this.cache.get(cacheKey);
    if (settings) {
      return settings;
    }
    let newSetting: T = new type();
    const savedSettings = await this.getSettingByKey(key);
    newSetting = _.merge(newSetting, savedSettings);
    await this.saveSetting(newSetting);
    await this.cache.set(cacheKey, newSetting);
    return newSetting;
  }

  async saveSetting<T extends BaseSettings>(bean: T) {
    const type: any = bean.constructor;
    const key = type.__key__;
    const cacheKey = type.getCacheKey();

    const entity = await this.getByKey(key);
    if (entity) {
      entity.setting = JSON.stringify(bean);
      entity.access = type.__access__;
      await this.repository.save(entity);
    } else {
      const newEntity = new SysSettingsEntity();
      newEntity.key = key;
      newEntity.title = type.__title__;
      newEntity.setting = JSON.stringify(bean);
      newEntity.access = type.__access__;
      await this.repository.save(newEntity);
    }

    await this.cache.set(cacheKey, bean);
  }

  async getPublicSettings(): Promise<SysPublicSettings> {
    return await this.getSetting(SysPublicSettings);
  }

  async savePublicSettings(bean: SysPublicSettings) {
    await this.saveSetting(bean);
  }

  async getPrivateSettings(): Promise<SysPrivateSettings> {
    return await this.getSetting(SysPrivateSettings);
  }

  async savePrivateSettings(bean: SysPrivateSettings) {
    await this.saveSetting(bean);

    //让设置生效
    await this.reloadPrivateSettings();
  }

  async reloadPrivateSettings() {
    const bean = await this.getPrivateSettings();
    if (bean.httpProxy || bean.httpsProxy) {
      const opts = {
        httpProxy: bean.httpProxy,
        httpsProxy: bean.httpsProxy,
      };
      setGlobalProxy(opts);
      agents.setGlobalProxy(opts);
    }
  }

  async updateByKey(key: string, setting: any) {
    const entity = await this.getByKey(key);
    if (entity) {
      entity.setting = JSON.stringify(setting);
      await this.repository.save(entity);
    } else {
      throw new Error('该设置不存在');
    }
    await this.cache.del(`settings.${key}`);
  }

  async backupSecret() {
    const settings = await this.getSettingByKey(SysSecretBackup.__key__);
    const privateSettings = await this.getPrivateSettings();
    const installInfo = await this.getSetting<SysInstallInfo>(SysInstallInfo);
    if (settings == null) {
      const backup = new SysSecretBackup();
      if (installInfo.siteId == null || privateSettings.encryptSecret == null) {
        logger.error('备份密钥失败，siteId或encryptSecret为空');
        return;
      }
      backup.siteId = installInfo.siteId;
      backup.encryptSecret = privateSettings.encryptSecret;
      await this.saveSetting(backup);
      logger.info('备份密钥成功');
    } else {
      //校验是否有变化
      if (settings.siteId !== installInfo.siteId) {
        throw new Error(`siteId与备份不一致，可能是数据异常，请检查：backup=${settings.siteId}, current=${installInfo.siteId}`);
      }
      if (settings.encryptSecret !== privateSettings.encryptSecret) {
        throw new Error('encryptSecret与备份不一致，可能是数据异常，请检查');
      }
    }
  }
}
