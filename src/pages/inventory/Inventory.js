/**
 * Created by tdzl2003 on 12/18/16.
 */
import React, { Component } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from '../../components';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import { IntField } from '../../components/Field';
import world from '../../logics/world';
import game from '../../logics/game';
import { upgrades, goods } from '../../../data';
import { hasEnough, predefinedName } from '../produce/Produce';
import { InventorySlot } from '../../logics/player';
import styles from './Inventory.less';
import { alert, prompt } from '../../common/message';
import { expr } from 'mobx-utils';

export const qualityStyles = [
  styles.btnNormal,
  styles.btnGood,
  styles.btnExcellent,
  styles.btnEpic,
  styles.btnLegend,
  styles.btnAcient,
  styles.btnArtifact,
];

export const qualityFontStyles = [
  styles.fontNormal,
  styles.fontGood,
  styles.fontExcellent,
  styles.fontEpic,
  styles.fontLegend,
  styles.fontAcient,
  styles.fontArtifact,
];

export const qualityNames = [
  '普通',
  '优秀',
  '精良',
  '史诗',
  '传说',
  '远古',
  '神器',
];

export const InventorySlotComp = observer(function InventorySlotComp({
  slot,
  onPress,
  selectedItem,
}) {
  const isActive = expr(() => {
    if (selectedItem && slot === selectedItem.get()) {
      return true;
    }
    return false;
  });
  return (
    <TouchableOpacity style={styles.slot} activeOpacity={0.8} onPress={onPress}>
      <View
        style={[
          styles.slotContent,
          qualityStyles[slot.displayQuality],
          slot.backgroundColor && { backgroundColor: slot.backgroundColor },
          isActive && styles.slotActive,
        ]}
      >
        <Text style={slot.nameColor && { color: slot.nameColor }}>
          {slot.name || '空'}
        </Text>
      </View>
      {slot.count > 1 && <Text style={styles.count}>{slot.count}</Text>}
    </TouchableOpacity>
  );
});

export function Button({ onPress, children, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text
        style={[styles.buttonLabel, disabled && styles.buttonDisabledLabel]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

// 这里只涉及基础属性的显示
const attrNames = {
  atk: '攻击力',
  atkSpeed: '攻击速度',
  def: '护甲',
  hpFromKill: '击杀恢复生命',
  mpFromKill: '击杀恢复法力',
  mpRecovery: '每5秒法力回复',
  maxHp: '生命值',
};

const renderNames = {
  atkSpeed: (value) => value.toFixed(1),
  mpRecovery: (value) => Math.round(value * 5),
  maxHp: (value) => `+${value}`,
};

export const predefinedDescriptions = {
  diamonds: '一丝创世神的力量。',
  gold: '金币',
};

export const GoodDetail = observer(function GoodDetail(
  { slot: _slot, selected, type },
  { navigator }
) {
  const slot = _slot || (selected && selected.get());
  if (slot && slot.key === 'ticket') {
    return (
      <View style={styles.detail}>
        <View style={styles.row}>
          <Text style={styles.detailName}>{slot.name}</Text>
          <Text style={styles.detailCount}> x {slot.count}</Text>
        </View>
        <View style={[styles.row, styles.spacer]}>
          <View style={styles.spacer}>
            <View style={styles.spacer} />
            <Text numberOfLines={2}>
              钥石可以让你再次挑战已经挑战过的副本。
            </Text>
          </View>
          <View style={styles.row}>
            <Button
              onPress={() => {
                alert('提示', '确定要丢弃该钥石吗？', [
                  {
                    text: '确认',
                    onPress: () => {
                      selected.set(null);
                      slot.clear();
                    },
                  },
                  { text: '取消' },
                ]);
              }}
            >
              抛弃
            </Button>
          </View>
          {type === 'bank' && slot.position === 'inventory' && (
            <Button
              onPress={() => {
                world.player.loot(slot, game.bank);
              }}
            >
              保存
            </Button>
          )}
          {type === 'bank' && slot.position === 'bank' && (
            <Button
              onPress={() => {
                world.player.loot(slot);
              }}
            >
              取出
            </Button>
          )}
        </View>
      </View>
    );
  }
  if (!slot || !slot.goodData) {
    if (slot && predefinedName[slot.key]) {
      return (
        <View style={styles.detail}>
          <View style={styles.row}>
            <Text style={styles.detailName}>{predefinedName[slot.key]}</Text>
            <Text style={styles.detailCount}> x {slot.count}</Text>
          </View>
          <View style={styles.spacer}>
            <View style={styles.spacer} />
            <Text numberOfLines={2}>{predefinedDescriptions[slot.key]}</Text>
          </View>
        </View>
      );
    }
    return <View style={styles.detail} />;
  }
  const { isEquip } = slot;
  const canEquip = isEquip && world.playerUnit.canEquip(slot);
  let ops;
  switch (type) {
    case 'bank':
      ops = (
        <View style={styles.row}>
          {slot.position === 'inventory' && (
            <Button
              onPress={() => {
                world.player.loot(slot, game.bank);
              }}
            >
              保存
            </Button>
          )}
          {slot.position === 'bank' && (
            <Button
              onPress={() => {
                world.player.loot(slot);
              }}
            >
              取出
            </Button>
          )}
          {slot.price && slot.count >= 1 && !slot.locked && (
            <Button
              onPress={async () => {
                if (slot.count > 1) {
                  const v = await prompt('输入数量', '', `${slot.count}`);
                  const { count } = selected.get();
                  const tmp = Math.max(0, v | 0);
                  if (count === tmp) {
                    selected.set(null);
                    world.player.sellItem(slot, tmp);
                  } else if (count > tmp) {
                    world.player.sellItem(slot, tmp);
                  } else if (count < tmp) {
                    alert('别逗我啦。');
                    return false;
                  }
                } else if (slot.quality >= 3) {
                  alert(
                    '提示',
                    `该商品为${qualityNames[slot.quality]}物品，是否确定出售？`,
                    [
                      {
                        text: '确认',
                        onPress: () => {
                          selected.set(null);
                          world.player.sellItem(slot, 1);
                        },
                      },
                      { text: '取消' },
                    ]
                  );
                } else {
                  selected.set(null);
                  world.player.sellItem(slot, 1);
                }
              }}
            >
              出售
            </Button>
          )}
          {slot.isEquip && (
            <Button
              onPress={() => {
                slot.locked = !slot.locked;
              }}
            >
              {slot.locked ? '解锁' : '锁定'}
            </Button>
          )}
        </View>
      );
      break;
    default:
      ops = (
        <View style={styles.row}>
          {slot.isEquip && slot.position === 'inventory' && (
            <Button
              disabled={!canEquip}
              onPress={() => {
                world.player.equip(slot);
              }}
            >
              装备
            </Button>
          )}
          {slot.position === 'equip' && (
            <Button
              disabled={!canEquip}
              onPress={() => {
                world.player.unequip(slot);
              }}
            >
              卸下
            </Button>
          )}
          {slot.goodData && slot.goodData.type === 'package' && (
            <Button onPress={() => world.usePackage(slot)}>打开</Button>
          )}
          {slot.price &&
            slot.position !== 'equip' &&
            slot.count >= 1 &&
            !slot.locked && (
              <Button
                onPress={async () => {
                  if (slot.count > 1) {
                    const v = await prompt('输入数量', '', `${slot.count}`);
                    const { count } = selected.get();
                    const tmp = Math.max(0, v | 0);
                    if (count === tmp) {
                      selected.set(null);
                      world.player.sellItem(slot, tmp);
                    } else if (count > tmp) {
                      world.player.sellItem(slot, tmp);
                    } else if (count < tmp) {
                      alert('别逗我啦。');
                      return false;
                    }
                  } else if (slot.quality >= 3) {
                    alert(
                      '提示',
                      `该商品为${
                        qualityNames[slot.quality]
                      }物品，是否确定出售？`,
                      [
                        {
                          text: '确认',
                          onPress: () => {
                            selected.set(null);
                            world.player.sellItem(slot, 1);
                          },
                        },
                        { text: '取消' },
                      ]
                    );
                  } else {
                    selected.set(null);
                    world.player.sellItem(slot, 1);
                  }
                }}
              >
                出售
              </Button>
            )}
          {slot.isEquip && (
            <Button
              onPress={() => {
                slot.locked = !slot.locked;
              }}
            >
              {slot.locked ? '解锁' : '锁定'}
            </Button>
          )}
        </View>
      );
      break;
  }

  return (
    <View style={styles.detail}>
      <View style={styles.row}>
        <Text style={styles.detailName}>
          {slot.name}
          {slot.originName && (
            <Text style={styles.originName}>({slot.originName})</Text>
          )}
        </Text>
        {slot.count !== 1 && (
          <Text style={styles.detailCount}> x {slot.count}</Text>
        )}
        <View style={styles.spacer} />
        {!!slot.price && (
          <Text style={styles.detailPrice}>
            出售单价:{slot.price}{' '}
            {slot.count > 1 && <Text>全部出售:{slot.totalPrice}</Text>}
          </Text>
        )}
      </View>
      <View style={[styles.row, styles.spacer]}>
        <View style={styles.spacer}>
          <View style={styles.row}>
            {isEquip && <Text>{slot.equipPositionName}</Text>}
            {isEquip && (
              <Text style={styles.marginLeft}>需要{slot.requireLevel}级</Text>
            )}
            {isEquip && (
              <Text style={styles.marginLeft}>装备等级{slot.level}</Text>
            )}
          </View>
          <Text>
            {isEquip &&
              Object.keys(attrNames).map(
                (key, i) =>
                  !!slot[key] && (
                    <Text key={i}>
                      {attrNames[key]}{' '}
                      {renderNames[key]
                        ? renderNames[key](slot[key])
                        : Math.round(slot[key])}
                    </Text>
                  )
              )}
          </Text>
          <Text>
            {slot.affixes.map((v, i) => (
              <Text style={[styles.affix, v.isLegend && styles.legend]} key={i}>
                {v.display}&nbsp;
              </Text>
            ))}
          </Text>
          <View style={styles.spacer} />
          <Text numberOfLines={2}>{slot.description}</Text>
        </View>
        {ops}
      </View>
    </View>
  );
});

const purchaseInventoryByDiamond = action(function purchaseInventoryByDiamond(
  navigator
) {
  const { player } = world;
  const cost = upgrades.inventoryByDiamonds[player.inventoryDiamondLevel];
  if (game.diamonds < cost) {
    alert('提示', '您的神力点数不足，是否召唤创世神的力量，大量获得神力？', [
      {
        text: '确认',
        onPress: () => {
          navigator.push({
            location: '/purchase',
          });
        },
      },
      { text: '取消' },
    ]);
    return;
  }
  game.diamonds -= cost;
  player.inventory.push(new InventorySlot('inventory'));
  player.inventoryDiamondLevel++;
});

const purchaseInventory = action(function purchaseInventory() {
  const { player } = world;
  const cost =
    upgrades.inventory[player.inventory.length - player.inventoryDiamondLevel];
  const { gold, ...materials } = cost;
  if (!hasEnough(cost)) {
    alert('提示', '物品扣除失败。请重试。');
    return;
  }
  if (gold) {
    player.gold -= gold;
  }
  for (const key of Object.keys(materials)) {
    player.costGood(key, materials[key]);
  }
  player.inventory.push(new InventorySlot('inventory'));
});

export function upgradeInventory(navigator) {
  const { player } = world;
  const cost =
    upgrades.inventory[player.inventory.length - player.inventoryDiamondLevel];
  const costDiamond =
    upgrades.inventoryByDiamonds[player.inventoryDiamondLevel];
  if (!cost) {
    // 只能用神力升级
    alert(
      '提示',
      `你的包裹已经超越极限，只有神的力量才能改变空间，继续扩张包裹消耗${costDiamond}神力，是否继续？`,
      [
        { text: '确认', onPress: () => purchaseInventoryByDiamond(navigator) },
        { text: '取消' },
      ]
    );
    return;
  }
  const costList = Object.keys(cost)
    .map((key) => `${predefinedName[key] || goods[key].name} x${cost[key]}`)
    .join('\n');

  if (!hasEnough(cost)) {
    // 物品不足，只能用神力升级
    alert(
      '提示',
      `包裹升级需要消耗：\n${costList}\n您的物品不足，是否消耗${costDiamond}神力改变空间，扩张包裹？`,
      [
        { text: '确认', onPress: () => purchaseInventoryByDiamond(navigator) },
        { text: '取消' },
      ]
    );
    return;
  }
  alert('提示', `包裹升级需要消耗：\n${costList}\n是否继续？`, [
    { text: '确认', onPress: () => purchaseInventory(cost) },
    { text: '取消' },
  ]);
}

export function UpgradeIcon({ onPress, children }) {
  return (
    <TouchableOpacity style={styles.slot} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.slotContent}>
        <Text>{children}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function BigBtn({ onPress, children }) {
  return (
    <TouchableOpacity
      style={styles.bigBtn}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.bigBtnContent}>
        <Text>{children}</Text>
      </View>
    </TouchableOpacity>
  );
}

@observer
export default class Inventory extends Component {
  static title = '包裹';
  static leftNavTitle = '祈祷';
  static rightNavTitle = '储藏箱';

  selectedItem = observable(null);
  onLeftPressed() {
    this.context.navigator.push({
      location: '/purchase',
    });
  }

  onRightPressed() {
    this.context.navigator.push({
      location: '/inventory/bank',
    });
  }

  setLootRule = () => {
    this.context.navigator.push({
      location: '/inventory/lootRule',
    });
  };

  renderRow = (v, i) => (
    <InventorySlotComp
      onPress={() => this.selectedItem.set(v)}
      key={i}
      slot={v}
      selectedItem={this.selectedItem}
    />
  );

  renderEquip(pos) {
    return this.renderRow(world.player.equipments[pos], pos);
  }

  render() {
    const { navigator } = this.context;
    const { player } = world;
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Text>
            金币: <IntField unit={player} field="gold" /> 神力:{' '}
            <IntField unit={game} field="diamonds" />
          </Text>
        </View>
        <View style={styles.row}>
          <Text>{player.name}的装备</Text>
          <ScrollView contentContainerStyle={styles.rowCenter} horizontal>
            {this.renderEquip('weapon')}
            {this.renderEquip('plastron')}
            {this.renderEquip('gaiter')}
            {this.renderEquip('ornament')}
          </ScrollView>
        </View>
        <GoodDetail selected={this.selectedItem} />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
        >
          {player.inventory.map(this.renderRow)}
          {player.inventoryDiamondLevel <
            upgrades.inventoryByDiamonds.length && (
            <UpgradeIcon onPress={() => upgradeInventory(navigator)}>
              +
            </UpgradeIcon>
          )}
          <BigBtn onPress={() => player.sortInventory(player.inventory)}>
            整理包裹
          </BigBtn>
          <BigBtn onPress={this.setLootRule}>拾取规则</BigBtn>
        </ScrollView>
      </View>
    );
  }
}
