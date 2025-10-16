const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Member = sequelize.define('Member', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  lastname: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tc: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  photo: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for master admin
    references: {
      model: 'tenants',
      key: 'id'
    }
  }
}, {
  tableName: 'members',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  hooks: {
    beforeCreate: async (member) => {
      if (member.password) {
        member.password = await bcrypt.hash(member.password, 12);
      }
    },
    beforeUpdate: async (member) => {
      if (member.changed('password')) {
        member.password = await bcrypt.hash(member.password, 12);
      }
    }
  }
});

// Instance methods
Member.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

Member.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = Member;
