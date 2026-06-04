FROM freeradius/freeradius-server:3.2.7

USER root

COPY config/mods-available/sql /etc/freeradius/3.0/mods-available/sql
COPY config/sites-available/dynamic-clients /etc/freeradius/sites-available/dynamic-clients
COPY config/clients.conf /etc/freeradius/clients.d/iss.conf
COPY scripts/reload-radius.sh /usr/local/bin/reload-radius.sh
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/reload-radius.sh /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /etc/freeradius/3.0/mods-enabled /etc/freeradius/3.0/sites-enabled \
  && ln -sf /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/sql \
  && ln -sf /etc/freeradius/3.0/mods-available/sql /etc/freeradius/mods-enabled/sql \
  && ln -sf /etc/freeradius/sites-available/dynamic-clients /etc/freeradius/sites-enabled/dynamic-clients \
  && sed -i 's/-sql/sql/g' /etc/freeradius/sites-available/default /etc/freeradius/sites-available/inner-tunnel \
  && sed -i 's/^[[:space:]]*filter_username/#\tfilter_username/' /etc/freeradius/sites-available/default \
  && sed -i 's/^[[:space:]]*require_message_authenticator = auto/require_message_authenticator = no/' /etc/freeradius/radiusd.conf \
  && sed -i 's/^[[:space:]]*limit_proxy_state = auto/limit_proxy_state = no/' /etc/freeradius/radiusd.conf

EXPOSE 1812/udp 1813/udp

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
