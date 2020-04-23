import BaseService from "./BaseService";
import {
  ApplicationPrivatePocketAccount,
  ApplicationPublicPocketAccount,
  ExtendedPocketApplication,
  PocketApplication,
  StakedApplicationSummary
} from "../models/Application";
import PocketAAT from "@pokt-network/aat-js";
import {Account, Application, StakingStatus} from "@pokt-network/pocket-js";
import UserService from "./UserService";
import bcrypt from "bcrypt";
import bigInt from "big-integer";
import {Configurations} from "../_configuration";
import {Chains} from "../providers/NetworkChains";

const APPLICATION_COLLECTION_NAME = "Applications";

export default class ApplicationService extends BaseService {


  constructor() {
    super();

    this.userService = new UserService();
  }

  /**
   * Generate a random passphrase.
   *
   * @param {PocketApplication} application Application.
   *
   * @returns {string} A passphrase.
   * @private
   * @async
   */
  async __generatePassphrase(application) {
    const seed = 10;

    const now = new Date();
    const data = `${application.name} + ${now.toUTCString()}`;

    return await bcrypt.hash(data, seed);
  }

  /**
   * Persist application on db if not exists.
   *
   * @param {PocketApplication} application Application to persist.
   *
   * @returns {Promise<boolean>} If application was persisted or not.
   * @private
   * @async
   */
  async __persistApplicationIfNotExists(application) {

    if (!await this.applicationExists(application)) {
      /** @type {{result: {n:number, ok: number}}} */
      const result = await this.persistenceService.saveEntity(APPLICATION_COLLECTION_NAME, application);

      return result.result.ok === 1;
    }

    return false;
  }

  /**
   * Create a pocket account in the network.
   *
   * @param {string} passPhrase Passphrase used to create pocket account.
   *
   * @returns {Promise<Account> | Error} A Pocket account created successfully.
   * @throws {Error} If creation of account fails.
   * @private
   */
  async __createPocketAccount(passPhrase) {
    const account = await this.pocketService.createAccount(passPhrase);

    if (account instanceof Error) {
      throw account;
    }

    return account;
  }

  /**
   *
   * @param {PocketApplication} application Application to add pocket data.
   *
   * @returns {Promise<ExtendedPocketApplication>} Pocket application with pocket data.
   * @private
   * @async
   */
  async __getExtendedPocketApplication(application) {
    /** @type {Application} */
    let networkApplication;
    const networkChainHashes = Chains.map(_ => _.hash);
    const appParameters = await this.pocketService.getApplicationParameters();

    if (!application.freeTier) {
      try {
        networkApplication = await this.pocketService.getApplication(application.publicPocketAccount.address);
      } catch (e) {
        networkApplication = ExtendedPocketApplication.createNetworkApplication(application.publicPocketAccount, networkChainHashes, appParameters);
      }
    } else {
      const passPhrase = "PocketFreeTierAccount";
      const freeTierAccount = await this.pocketService.getFreeTierAccount(passPhrase);

      networkApplication = ExtendedPocketApplication.createNetworkApplicationAsFreeTier(freeTierAccount, networkChainHashes, appParameters);
    }

    return ExtendedPocketApplication.createExtendedPocketApplication(application, networkApplication);
  }

  /**
   *
   * @param {PocketApplication[]} applications Applications to add pocket data.
   *
   * @returns {Promise<ExtendedPocketApplication[]>} Pocket applications with pocket data.
   * @private
   * @async
   */
  async __getExtendedPocketApplications(applications) {
    const extendedApplications = applications.map(async (application) => this.__getExtendedPocketApplication(application));

    return Promise.all(extendedApplications);
  }

  /**
   * Mark application as Free tier.
   *
   * @param {PocketApplication} application Pocket application to mark as free tier.
   * @private
   */
  async __markApplicationAsFreeTier(application) {
    const filter = {
      "publicPocketAccount.address": application.publicPocketAccount.address
    };

    application.freeTier = true;
    await this.persistenceService.updateEntity(APPLICATION_COLLECTION_NAME, filter, application);
  }

  /**
   * Get an AAT of the application.
   *
   * @param {string} clientPublicKey Client account public key to create AAT.
   * @param {Account} applicationAccount Application account to create AAT.
   * @param {string} applicationPassphrase Application passphrase.
   *
   * @returns {PocketAAT} Application AAT.
   */
  async __getAAT(clientPublicKey, applicationAccount, applicationPassphrase) {
    return this.pocketService.getApplicationAuthenticationToken(clientPublicKey, applicationAccount, applicationPassphrase);
  }

  /**
   * Check if application exists on DB.
   *
   * @param {PocketApplication} application Application to check if exists.
   *
   * @returns {Promise<boolean>} If application exists or not.
   * @async
   */
  async applicationExists(application) {
    const filter = {name: application.name, owner: application.owner};
    const dbApplication = await this.persistenceService.getEntityByFilter(APPLICATION_COLLECTION_NAME, filter);

    return dbApplication !== undefined;
  }

  /**
   * Import application account.
   *
   * @param {string} applicationAccountPrivateKey Application account private key.
   *
   * @returns {Promise<ApplicationPublicPocketAccount>} a pocket account.
   * @throws Error If account is invalid.
   * @async
   */
  async importApplicationNetworkAccount(applicationAccountPrivateKey) {
    const passPhrase = "ApplicationNetworkAccount";
    const applicationAccount = await this.pocketService.importAccount(applicationAccountPrivateKey, passPhrase);

    if (applicationAccount instanceof Error) {
      throw TypeError("Application account is invalid");
    }

    return ApplicationPublicPocketAccount.createApplicationPublicPocketAccount(applicationAccount);
  }

  /**
   * Get application data from network.
   *
   * @param {string} applicationAddress Application address.
   *
   * @returns {Promise<Application>} Application data.
   * @throws Error If application already exists on dashboard or application does exist on network.
   * @async
   */
  async getApplicationFromNetwork(applicationAddress) {
    const filter = {
      "publicPocketAccount.address": applicationAddress
    };

    const applicationDB = await this.persistenceService.getEntityByFilter(APPLICATION_COLLECTION_NAME, filter);

    if (applicationDB) {
      throw Error("Application already exists in dashboard");
    }

    try {
      return this.pocketService.getApplication(applicationAddress);
    } catch (e) {
      throw TypeError("Application does not exist on network");
    }
  }

  /**
   * Get application data.
   *
   * @param {string} applicationAddress Application address.
   *
   * @returns {Promise<ExtendedPocketApplication>} Application data.
   * @async
   */
  async getApplication(applicationAddress) {
    const filter = {
      "publicPocketAccount.address": applicationAddress
    };

    const applicationDB = await this.persistenceService.getEntityByFilter(APPLICATION_COLLECTION_NAME, filter);

    if (applicationDB) {
      const application = PocketApplication.createPocketApplication(applicationDB);

      return this.__getExtendedPocketApplication(application);
    }

    return null;
  }

  /**
   * Get all applications on network.
   *
   * @param {number} limit Limit of query.
   * @param {number} [offset] Offset of query.
   * @param {number} [stakingStatus] Staking status filter.
   *
   * @returns {ExtendedPocketApplication[]} List of applications.
   * @async
   */
  async getAllApplications(limit, offset = 0, stakingStatus = undefined) {
    const applications = (await this.persistenceService.getEntities(APPLICATION_COLLECTION_NAME, {}, limit, offset))
      .map(PocketApplication.createPocketApplication);

    if (applications) {
      const extendedApplications = await this.__getExtendedPocketApplications(applications);

      if (stakingStatus !== undefined) {
        return extendedApplications.filter((application) => application.networkData.status === StakingStatus.getStatus(stakingStatus));
      }

      return extendedApplications;
    }

    return [];
  }

  /**
   * Get all applications on network that belongs to user.
   *
   * @param {string} userEmail Email of user.
   * @param {number} limit Limit of query.
   * @param {number} [offset] Offset of query.
   * @param {number} [stakingStatus] Staking status filter.
   *
   * @returns {Promise<ExtendedPocketApplication[]>} List of applications.
   * @async
   */
  async getUserApplications(userEmail, limit, offset = 0, stakingStatus = undefined) {
    const filter = {user: userEmail};
    const applications = (await this.persistenceService.getEntities(APPLICATION_COLLECTION_NAME, filter, limit, offset))
      .map(PocketApplication.createPocketApplication);

    if (applications) {
      const extendedApplications = await this.__getExtendedPocketApplications(applications);

      if (stakingStatus !== undefined) {
        return extendedApplications.filter((application) => application.networkData.status === StakingStatus.getStatus(stakingStatus));
      }

      return extendedApplications;
    }

    return [];
  }

  /**
   * Get staked application summary.
   *
   * @returns {Promise<StakedApplicationSummary>} Summary data of staked applications.
   * @async
   */
  async getStakedApplicationSummary() {
    try {
      /** @type {Application[]} */
      const stakedApplications = await this.pocketService.getApplications(StakingStatus.Staked);

      // noinspection JSValidateTypes
      const totalApplications = bigInt(stakedApplications.length);

      // noinspection JSValidateTypes
      /** @type {bigint} */
      const totalStaked = stakedApplications.reduce((acc, appA) => bigInt(appA.stakedTokens).add(acc), 0n);

      // noinspection JSValidateTypes
      /** @type {bigint} */
      const totalRelays = stakedApplications.reduce((acc, appA) => bigInt(appA.maxRelays).add(acc), 0n);

      // noinspection JSUnresolvedFunction
      const averageStaked = totalStaked.divide(totalApplications);
      // noinspection JSUnresolvedFunction
      const averageMaxRelays = totalRelays.divide(totalApplications);

      return new StakedApplicationSummary(totalApplications.value.toString(), averageStaked.value.toString(), averageMaxRelays.value.toString());

    } catch (e) {
      return new StakedApplicationSummary("0n", "0n", "0n");
    }
  }

  /**
   * Get AAT using Free tier account.
   *
   * @param {string} clientAccountAddress The client account address(In this case is the account of application).
   *
   * @returns {Promise<PocketAAT | boolean>} AAT for application.
   * @async
   */
  async getFreeTierAAT(clientAccountAddress) {
    const passphrase = "FreeTierAAT";
    const filter = {
      "publicPocketAccount.address": clientAccountAddress
    };

    const applicationDB = await this.persistenceService.getEntityByFilter(APPLICATION_COLLECTION_NAME, filter);

    if (!applicationDB) {
      return false;
    }

    const clientApplication = PocketApplication.createPocketApplication(applicationDB);

    try {
      const freeTierAccount = await this.pocketService.getFreeTierAccount(passphrase);

      return this.__getAAT(clientApplication.publicPocketAccount.publicKey, freeTierAccount, passphrase);

    } catch (e) {
      return false;
    }
  }

  /**
   * Unstake free tier application.
   *
   * @param {string} applicationAccountAddress Application account address.
   *
   * @returns {Promise<boolean>} If application was unstaked or not.
   * @async
   */
  async unstakeFreeTierApplication(applicationAccountAddress) {
    const passphrase = "UnstakeFreeTierApplication";
    const filter = {
      "publicPocketAccount.address": applicationAccountAddress
    };

    const applicationDB = await this.persistenceService.getEntityByFilter(APPLICATION_COLLECTION_NAME, filter);

    if (!applicationDB) {
      return false;
    }

    try {
      const freeTierAccount = await this.pocketService.getFreeTierAccount(passphrase);

      // Unstake application using free tier account
      await this.pocketService.unstakeApplication(freeTierAccount, passphrase);

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Create free tier application.
   *
   * @param {string} applicationAccountAddress Application account address.
   * @param {string[]} networkChains Network chains to stake application.
   *
   * @returns {Promise<PocketAAT | boolean>} If application was created or not.
   * @async
   */
  async markAsFreeTierApplication(applicationAccountAddress, networkChains) {
    const passphrase = "FreeTierApplication";
    const filter = {
      "publicPocketAccount.address": applicationAccountAddress
    };

    const applicationDB = await this.persistenceService.getEntityByFilter(APPLICATION_COLLECTION_NAME, filter);

    if (!applicationDB) {
      return false;
    }

    const clientApplication = PocketApplication.createPocketApplication(applicationDB);

    try {
      const freeTierAccount = await this.pocketService.getFreeTierAccount(passphrase);
      const stakeAmount = Configurations.pocket_network.free_tier.stake_amount;

      const aat = await this.__getAAT(clientApplication.publicPocketAccount.publicKey, freeTierAccount, passphrase);

      // Stake application using free tier account
      await this.pocketService.stakeApplication(freeTierAccount, passphrase, stakeAmount, networkChains);

      await this.__markApplicationAsFreeTier(clientApplication);

      return aat;

    } catch (e) {
      return false;
    }
  }

  /**
   * Create an application on network.
   *
   * @param {object} data Application data.
   * @param {object} data.application Application to create.
   * @param {string} data.application.name Name.
   * @param {string} data.application.owner Owner.
   * @param {string} data.application.url URL.
   * @param {string} data.application.contactEmail E-mail.
   * @param {string} data.application.user User.
   * @param {string} [data.application.description] Description.
   * @param {string} [data.application.icon] Icon.
   * @param {boolean} data.imported If is imported or not.
   * @param {string} [data.privateKey] Application private key if is imported.
   *
   * @returns {Promise<{privateApplicationData: ApplicationPrivatePocketAccount, networkData:Application}| boolean>} An application information or false if not.
   * @throws {Error} If validation fails or already exists.
   * @async
   */
  async createApplication(data) {
    if (PocketApplication.validate(data.application)) {
      if (!await this.userService.userExists(data.application.user)) {
        throw new Error("User does not exist");
      }

      const application = PocketApplication.createPocketApplication(data.application);

      if (await this.applicationExists(application)) {
        throw new Error("Application already exists");
      }

      const passPhrase = await this.__generatePassphrase(application);
      let pocketAccount;

      if (data.imported) {
        const account = await this.pocketService.importAccount(data.privateKey, passPhrase);

        if (account instanceof Error) {
          throw Error("Imported account is invalid");
        }

        pocketAccount = account;
      } else {
        // Generate Pocket account for application.
        pocketAccount = await this.__createPocketAccount(passPhrase);
      }

      application.publicPocketAccount = ApplicationPublicPocketAccount.createApplicationPublicPocketAccount(pocketAccount);

      const created = await this.__persistApplicationIfNotExists(application);

      if (created) {
        const appParameters = await this.pocketService.getApplicationParameters();

        const privateApplicationData = await ApplicationPrivatePocketAccount.createApplicationPrivatePocketAccount(this.pocketService, pocketAccount, passPhrase);
        const networkChainHashes = Chains.map(_ => _.hash);
        const networkData = ExtendedPocketApplication.createNetworkApplication(application.publicPocketAccount, networkChainHashes, appParameters);

        return {privateApplicationData, networkData};
      }

      return false;
    }
  }

  /**
   * Delete an application from dashboard(not from network).
   *
   * @param {string} applicationAccountAddress Application account address.
   *
   * @returns {Promise<boolean>} If application was deleted or not.
   * @async
   */
  async deleteApplication(applicationAccountAddress) {
    const filter = {
      "publicPocketAccount.address": applicationAccountAddress
    };

    /** @type {{result: {n:number, ok: number}}} */
    const result = await this.persistenceService.deleteEntities(APPLICATION_COLLECTION_NAME, filter);

    return result.result.ok === 1;
  }

}
