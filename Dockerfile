FROM rust:1-buster as build-subs

WORKDIR /usr

ENV LANG=C.UTF-8

RUN apt-get update && apt-get install -y git clang libclang-dev
RUN rustup update nightly
RUN rustup target add wasm32-unknown-unknown --toolchain nightly

RUN git clone https://github.com/xp-network/vm_hub_pallet /usr/vm_hub_pallet
WORKDIR /usr/vm_hub_pallet/substrate-node-template
RUN cargo build --release


FROM python:3.9-buster as runner

WORKDIR /usr

RUN apt-get update
RUN apt-get install -y openssl curl software-properties-common git
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs
RUN npm install -g yarn

RUN wget -O binaryen.tar.gz https://github.com/WebAssembly/binaryen/releases/download/version_101/binaryen-version_101-x86_64-linux.tar.gz
RUN tar xf binaryen.tar.gz
WORKDIR /usr/binaryen-version_101
RUN cp ./bin/* /usr/bin
RUN cp ./include/* /usr/include
RUN cp ./lib64/* /usr/lib64
RUN wasm-opt --version

RUN useradd -ms /bin/bash runner
USER runner

WORKDIR /home/runner

COPY --from=build-subs /usr/vm_hub_pallet/substrate-node-template/target/release/node-template /home/runner/node-template

# substrate frontend
RUN git clone https://github.com/substrate-developer-hub/substrate-front-end-template -b v3.0.0
WORKDIR /home/runner/substrate-front-end-template
RUN yarn install

# ink! setup
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/home/runner/.cargo/bin:$PATH"
RUN rustup update nightly
RUN rustup component add rust-src --toolchain nightly
RUN rustup target add wasm32-unknown-unknown --toolchain stable
RUN cargo install cargo-contract

# erdpy setup
RUN wget -O erdpy-up.py https://raw.githubusercontent.com/ElrondNetwork/elrond-sdk-erdpy/master/erdpy-up.py
RUN python3.9 erdpy-up.py
ENV PATH="/home/runner/elrondsdk:$PATH"

WORKDIR /home/runner/app
COPY --chown=runner . /home/runner/app

WORKDIR /home/runner/app/elrond-mint-contract

# I don't know why the shipped erdpy is broken.
# Use local snapshot
RUN rm -rf /home/runner/elrondsdk/erdpy-venv/lib/python3.9/site-packages/erdpy
COPY ./erdpy /home/runner/elrondsdk/erdpy-venv/lib/python3.9/site-packages/erdpy/


RUN erdpy config set chainID "local-testnet"
RUN erdpy config set proxy "http://0.0.0.0:7950"

RUN erdpy testnet prerequisites
RUN erdpy testnet clean
RUN erdpy testnet config
RUN erdpy contract build .

WORKDIR /home/runner/app/freezer
RUN cargo +nightly contract build

WORKDIR /home/runner/app/validator
RUN yarn install

WORKDIR /home/runner/app/elrond-event-middleware
RUN yarn install

WORKDIR /home/runner/app/testsuite
RUN pip3.9 install -r requirements.txt
CMD ["./docker_run.sh"]
