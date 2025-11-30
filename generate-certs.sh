#!/bin/bash

# 自动生成自签名SSL证书脚本
# 用于开发和内网环境

set -e

CERTS_DIR="./certs"
CERT_FILE="$CERTS_DIR/cert.pem"
KEY_FILE="$CERTS_DIR/key.pem"

# 默认配置
DEFAULT_IP="10.81.6.4"
DEFAULT_DAYS=3650  # 10年有效期
DEFAULT_COUNTRY="CN"
DEFAULT_STATE="Beijing"
DEFAULT_CITY="Beijing"
DEFAULT_ORG="Pighub Mirror"
DEFAULT_OU="IT"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Pighub Mirror SSL证书生成工具 ===${NC}\n"

# 检查openssl是否安装
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}错误: 未找到 openssl 命令${NC}"
    echo "请先安装 openssl:"
    echo "  Ubuntu/Debian: sudo apt-get install openssl"
    echo "  CentOS/RHEL: sudo yum install openssl"
    echo "  macOS: brew install openssl"
    exit 1
fi

# 创建certs目录
if [ ! -d "$CERTS_DIR" ]; then
    echo -e "${YELLOW}创建目录: $CERTS_DIR${NC}"
    mkdir -p "$CERTS_DIR"
fi

# 检查是否已存在证书
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}警告: 证书文件已存在${NC}"
    echo "  $CERT_FILE"
    echo "  $KEY_FILE"
    read -p "是否覆盖现有证书? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}操作已取消${NC}"
        exit 0
    fi
fi

# 获取用户输入
echo -e "${GREEN}请输入证书信息 (直接回车使用默认值):${NC}\n"

read -p "IP地址或域名 [$DEFAULT_IP]: " IP_ADDRESS
IP_ADDRESS=${IP_ADDRESS:-$DEFAULT_IP}

read -p "证书有效期(天) [$DEFAULT_DAYS]: " DAYS
DAYS=${DAYS:-$DEFAULT_DAYS}

read -p "国家代码 [$DEFAULT_COUNTRY]: " COUNTRY
COUNTRY=${COUNTRY:-$DEFAULT_COUNTRY}

read -p "省份/州 [$DEFAULT_STATE]: " STATE
STATE=${STATE:-$DEFAULT_STATE}

read -p "城市 [$DEFAULT_CITY]: " CITY
CITY=${CITY:-$DEFAULT_CITY}

read -p "组织名称 [$DEFAULT_ORG]: " ORG
ORG=${ORG:-$DEFAULT_ORG}

read -p "部门名称 [$DEFAULT_OU]: " OU
OU=${OU:-$DEFAULT_OU}

echo -e "\n${GREEN}开始生成证书...${NC}\n"

# 创建临时配置文件
CONFIG_FILE=$(mktemp)
cat > "$CONFIG_FILE" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = $COUNTRY
ST = $STATE
L = $CITY
O = $ORG
OU = $OU
CN = $IP_ADDRESS

[v3_req]
subjectAltName = @alt_names
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
IP.1 = $IP_ADDRESS
DNS.1 = $IP_ADDRESS
DNS.2 = localhost
IP.2 = 127.0.0.1
EOF

# 生成私钥和证书
openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -days "$DAYS" \
    -config "$CONFIG_FILE"

# 清理临时文件
rm -f "$CONFIG_FILE"

# 设置文件权限
chmod 644 "$CERT_FILE"
chmod 600 "$KEY_FILE"

echo -e "\n${GREEN}✓ 证书生成成功！${NC}\n"
echo "证书文件: $CERT_FILE"
echo "私钥文件: $KEY_FILE"
echo "有效期: $DAYS 天"
echo "主机: $IP_ADDRESS"

# 显示证书信息
echo -e "\n${GREEN}证书详细信息:${NC}"
openssl x509 -in "$CERT_FILE" -noout -text | grep -A 2 "Validity"
openssl x509 -in "$CERT_FILE" -noout -text | grep -A 3 "Subject:"

echo -e "\n${YELLOW}注意事项:${NC}"
echo "1. 这是自签名证书，浏览器会显示安全警告"
echo "2. 首次访问时需要在浏览器中信任此证书"
echo "3. 如需修改IP地址，请重新运行此脚本"
echo "4. 证书已保存在 $CERTS_DIR 目录"
echo ""
echo -e "${GREEN}现在可以运行以下命令启动服务:${NC}"
echo "  docker-compose up -d"
echo ""
echo -e "${GREEN}访问地址:${NC}"
echo "  https://$IP_ADDRESS:8443"
echo ""
